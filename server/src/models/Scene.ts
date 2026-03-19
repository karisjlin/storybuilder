// Scene model — a sub-unit of a Chapter.
// Authors can break chapters into named scenes and reorder them independently.
// Content is stored as JSONB (TipTap JSON document), same as Chapter.
import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { Chapter } from './Chapter';

@Table({ tableName: 'scenes', timestamps: true })
export class Scene extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => Chapter)
  @Column(DataType.UUID)
  declare chapterId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  // TipTap JSON document — null until the user writes something
  @AllowNull(true)
  @Column(DataType.JSONB)
  declare content: object | null;

  // Integer position used for drag-and-drop reordering within the chapter
  @Default(0)
  @Column(DataType.INTEGER)
  declare order: number;

  // Word count computed on the client and stored for display in the sidebar
  @Default(0)
  @Column(DataType.INTEGER)
  declare wordCount: number;

  @BelongsTo(() => Chapter)
  declare chapter: Chapter;
}
