import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  Unique,
  AllowNull,
  DataType,
  HasMany,
} from 'sequelize-typescript';
import { Story } from './Story';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare username: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare password: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare avatarUrl: string | null;

  @HasMany(() => Story)
  declare stories: Story[];
}
