import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import sequelize from './config/database';

const PORT = process.env.PORT || 6000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
