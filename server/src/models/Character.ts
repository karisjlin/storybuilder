// Character model — represents a character within a Story.
// Traits are stored as JSONB (array of strings) to avoid a separate traits table.
import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, ForeignKey, BelongsTo, HasMany,
} from 'sequelize-typescript';
import { Story } from './Story';

@Table({ tableName: 'characters', timestamps: true })
export class Character extends Model {
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

  @AllowNull(true)
  @Column(DataType.STRING)
  declare role: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare bio: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare age: number | null;

  // URL to an uploaded or externally hosted avatar image
  @AllowNull(true)
  @Column(DataType.STRING)
  declare imageUrl: string | null;

  // Flexible array of custom trait labels (e.g. ["brave", "stubborn"])
  @Default([])
  @Column(DataType.JSONB)
  declare traits: string[];

  @BelongsTo(() => Story)
  declare story: Story;
}
