import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Story } from '../models/Story';
import { Chapter } from '../models/Chapter';
import { Scene } from '../models/Scene';
import { Character } from '../models/Character';
import { CharacterRelationship } from '../models/CharacterRelationship';
import { WorldEntry } from '../models/WorldEntry';
import { Tag } from '../models/Tag';
import { TagAssignment } from '../models/TagAssignment';
import { SceneCharacter } from '../models/SceneCharacter';
import { SceneWorldEntry } from '../models/SceneWorldEntry';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/storyforge';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  models: [User, Story, Chapter, Scene, Character, CharacterRelationship, WorldEntry, Tag, TagAssignment, SceneCharacter, SceneWorldEntry],
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
