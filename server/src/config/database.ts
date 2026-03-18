import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Story } from '../models/Story';
import { Chapter } from '../models/Chapter';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/storyforge';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  models: [User, Story, Chapter],
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions:
    process.env.NODE_ENV === 'production'
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
});

export default sequelize;
