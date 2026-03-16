import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  AllowNull,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './User';

@Table({ tableName: 'stories', timestamps: true })
export class Story extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare userId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string | null;

  @Default('draft')
  @Column(DataType.ENUM('draft', 'in_progress', 'complete'))
  declare status: 'draft' | 'in_progress' | 'complete';

  @BelongsTo(() => User)
  declare user: User;
}
