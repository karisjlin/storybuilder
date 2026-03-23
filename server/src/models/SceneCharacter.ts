// SceneCharacter — join table linking scenes to characters.
// Allows tracking which characters appear in each scene.
import {
  Table, Column, Model, PrimaryKey, Default, DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Scene } from './Scene';
import { Character } from './Character';

@Table({ tableName: 'scene_characters', timestamps: false })
export class SceneCharacter extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Scene)
  @Column(DataType.UUID)
  declare sceneId: string;

  @ForeignKey(() => Character)
  @Column(DataType.UUID)
  declare characterId: string;
}
