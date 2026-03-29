// Tag — a coloured label that can be applied to chapters, characters, or world entries.
// Tag assignment is handled via the polymorphic TagAssignment join table.
import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, ForeignKey, BelongsTo, HasMany, Index,
} from 'sequelize-typescript';
import { Story } from './Story';
import { TagAssignment } from './TagAssignment';

@Table({ tableName: 'tags', timestamps: true })
export class Tag extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Index
  @AllowNull(false)
  @ForeignKey(() => Story)
  @Column(DataType.UUID)
  declare storyId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  // Hex colour string, e.g. "#FF6B35"
  @AllowNull(false)
  @Default('#6B7280')
  @Column(DataType.STRING)
  declare color: string;

  @BelongsTo(() => Story)
  declare story: Story;

  @HasMany(() => TagAssignment)
  declare assignments: TagAssignment[];
}
