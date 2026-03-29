// CharacterRelationship — a directional link between two characters in the same story.
// characterAId and characterBId are ordered by convention (A is the "source").
import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, ForeignKey, BelongsTo, Index,
} from 'sequelize-typescript';
import { Story } from './Story';
import { Character } from './Character';

@Table({
  tableName: 'character_relationships',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['characterAId', 'characterBId', 'type'] },
  ],
})
export class CharacterRelationship extends Model {
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
  @ForeignKey(() => Character)
  @Column(DataType.UUID)
  declare characterAId: string;

  @AllowNull(false)
  @ForeignKey(() => Character)
  @Column(DataType.UUID)
  declare characterBId: string;

  // Relationship label, e.g. "rivals", "mentor/student", "siblings"
  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string | null;

  @BelongsTo(() => Story)
  declare story: Story;

  @BelongsTo(() => Character, 'characterAId')
  declare characterA: Character;

  @BelongsTo(() => Character, 'characterBId')
  declare characterB: Character;
}
