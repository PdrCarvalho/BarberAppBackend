import Sequelize from 'sequelize';
import mongoose from 'mongoose';
import databaseCofig from '../config/database';

import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/appointment';

const models = [User, File, Appointment];
class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    this.connection = new Sequelize(databaseCofig);
    models
      .map((model) => model.init(this.connection))
      .map((model) => model.associate && model.associate(this.connection.models));
  }

  mongo() {
    this.mongoConnection = mongoose.connect('mongodb://localhost:27017/barberapp',
      { useNewUrlParser: true, useFindAndModify: true, useUnifiedTopology: true });
  }
}

export default new Database();
