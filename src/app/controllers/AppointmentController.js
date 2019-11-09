import * as Yup from 'yup';
import { isBefore, startOfHour, parseISO } from 'date-fns';

import Appointment from '../models/appointment';
import User from '../models/User';
import File from '../models/File';

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
    return res.json(appointment);
  }
}

export default new ApointmenteController();
