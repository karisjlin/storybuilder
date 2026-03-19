// TagAssignment — polymorphic join table linking a Tag to any taggable entity.
// taggableType discriminates which table taggableId refers to.
import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { Tag } from './Tag';

export type TaggableType = 'chapter' | 'character' | 'worldEntry';

@Table({ tableName: 'tag_assignments', timestamps: true })
export class TagAssignment extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => Tag)
  @Column(DataType.UUID)
  declare tagId: string;

  // ID of the tagged entity (chapter, character, or world entry)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare taggableId: string;

  @AllowNull(false)
  @Column(DataType.ENUM('chapter', 'character', 'worldEntry'))
  declare taggableType: TaggableType;

  @BelongsTo(() => Tag)
  declare tag: Tag;
}
