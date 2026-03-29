// Story model — top-level container for a user's writing project.
// A story owns chapters, characters, world entries, and tags.
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
  HasMany,
  Index,
} from 'sequelize-typescript';
import { User } from './User';
import { Chapter } from './Chapter';

@Table({ tableName: 'stories', timestamps: true })
export class Story extends Model {
  // UUID primary key — auto-generated on creation
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // Foreign key linking this story to its owner
  @Index
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

  // Workflow status shown on the dashboard card
  @Default('draft')
  @Column(DataType.ENUM('draft', 'in_progress', 'complete'))
  declare status: 'draft' | 'in_progress' | 'complete';

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare wordCountGoal: number | null;

  @BelongsTo(() => User)
  declare user: User;

  @HasMany(() => Chapter)
  declare chapters: Chapter[];
}
