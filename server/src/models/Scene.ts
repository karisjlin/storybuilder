// Scene model — a sub-unit of a Chapter.
// Authors break chapters into named scenes displayed as sticky note cards.
// BelongsToMany associations let scenes track which characters and world entries appear in them.
import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, ForeignKey, BelongsTo, BelongsToMany, Index,
} from 'sequelize-typescript';
import { Chapter } from './Chapter';
import { Character } from './Character';
import { WorldEntry } from './WorldEntry';
import { SceneCharacter } from './SceneCharacter';
import { SceneWorldEntry } from './SceneWorldEntry';

@Table({ tableName: 'scenes', timestamps: true })
export class Scene extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Index
  @AllowNull(false)
  @ForeignKey(() => Chapter)
  @Column(DataType.UUID)
  declare chapterId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  // Plain text content for the sticky note
  @AllowNull(true)
  @Column(DataType.TEXT)
  declare content: string | null;

  // Integer position for drag-and-drop reordering within the chapter
  @Default(0)
  @Column(DataType.INTEGER)
  declare order: number;

  // Word count computed on the client
  @Default(0)
  @Column(DataType.INTEGER)
  declare wordCount: number;

  @BelongsTo(() => Chapter)
  declare chapter: Chapter;

  // Characters appearing in this scene
  @BelongsToMany(() => Character, () => SceneCharacter)
  declare characters: Character[];

  // World entries (locations, items, factions etc.) appearing in this scene
  @BelongsToMany(() => WorldEntry, () => SceneWorldEntry)
  declare worldEntries: WorldEntry[];
}
