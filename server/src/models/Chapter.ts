// Chapter model — represents a single chapter within a Story.
// Content is stored as JSONB to match TipTap's native JSON document format.
// Order is an integer used for drag-and-drop reordering in the sidebar.
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
import { Story } from './Story';

@Table({ tableName: 'chapters', timestamps: true })
export class Chapter extends Model {
  // UUID primary key — auto-generated on creation
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // Foreign key linking this chapter to its parent story
  @AllowNull(false)
  @ForeignKey(() => Story)
  @Column(DataType.UUID)
  declare storyId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  // TipTap rich text document stored as JSONB — null until the user writes something
  @AllowNull(true)
  @Column(DataType.JSONB)
  declare content: object | null;

  // Integer position used for sidebar ordering; updated on drag-and-drop reorder
  @Default(0)
  @Column(DataType.INTEGER)
  declare order: number;

  // Chapter progress status shown in the sidebar
  @Default('todo')
  @Column(DataType.ENUM('todo', 'active', 'done'))
  declare status: 'todo' | 'active' | 'done';

  // Word count is computed on the client and stored here for display in the sidebar
  @Default(0)
  @Column(DataType.INTEGER)
  declare wordCount: number;

  // Short synopsis shown at the top of the chapter workspace — separate from the full draft
  @AllowNull(true)
  @Column(DataType.TEXT)
  declare summary: string | null;

  // Final draft — a separate TipTap document for the polished version of the chapter.
  // The rough draft lives in scenes; the final draft lives here.
  @AllowNull(true)
  @Column(DataType.JSONB)
  declare finalContent: object | null;

  @Default(0)
  @Column(DataType.INTEGER)
  declare finalWordCount: number;

  @BelongsTo(() => Story)
  declare story: Story;
}
