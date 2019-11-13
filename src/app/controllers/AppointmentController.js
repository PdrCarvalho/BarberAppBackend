import * as Yup from 'yup';
import {
  isBefore, startOfHour, parseISO, format, subHours,
} from 'date-fns';
import pt from 'date-fns/locale/pt';
import Notification from '../schemas/Notification';
import Appointment from '../models/appointment';
import User from '../models/User';
import File from '../models/File';
// import Mail from '../../lib/Mail';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class ApointmenteController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [{
        model: User,
        as: 'provider',
        attributes: ['id', 'name'],
        include: [{
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        }],
      }],
    });
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { provider_id, date } = req.body;
    const providerExist = await User.findOne({ where: { id: provider_id, provider: true } });
    if (!providerExist) {
      return res.status(401).json({ error: 'Provider not exist' });
    }
    const hourdStart = startOfHour(parseISO(date));
    if (isBefore(hourdStart, new Date())) {
      return res.status(400).json({ error: 'Past date are not permite' });
    }
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourdStart,
      },
    });
    if (checkAvailability) {
      return res.status(400).json({ error: 'already booked time' });
    }
    const appointment = await Appointment.create({ user_id: req.userId, provider_id, date });

    const user = await User.findByPk(req.userId);
    const formatDate = format(hourdStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt });

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formatDate}`,
      user: provider_id,
    });
    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({ error: 'permission fail' });
    }
    const dateWithSub = subHours(appointment.date, 2);
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({ error: 'You can only cancel appointments 2 hours in advance' });
    }
    appointment.canceled_at = new Date();
    await appointment.save();
    await Queue.add(CancellationMail.Key, {
      appointment,
    });

    return res.json(appointment);
  }
}
export default new ApointmenteController();
