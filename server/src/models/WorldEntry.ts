// WorldEntry — a world-building note attached to a story.
// Categories map to distinct world-building concerns (places, lore, objects, groups, etc.).
import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { Story } from './Story';

export type WorldCategory = 'location' | 'lore' | 'item' | 'faction' | 'event' | 'condition' | 'other';

@Table({ tableName: 'world_entries', timestamps: true })
export class WorldEntry extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => Story)
  @Column(DataType.UUID)
  declare storyId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.ENUM('location', 'lore', 'item', 'faction', 'event', 'condition', 'other'))
  declare category: WorldCategory;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string | null;

  @BelongsTo(() => Story)
  declare story: Story;
}
