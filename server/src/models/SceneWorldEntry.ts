// SceneWorldEntry — join table linking scenes to world entries.
// Allows tracking which locations, items, factions etc. appear in each scene.
import {
  Table, Column, Model, PrimaryKey, Default, DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Scene } from './Scene';
import { WorldEntry } from './WorldEntry';

@Table({ tableName: 'scene_world_entries', timestamps: false })
export class SceneWorldEntry extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Scene)
  @Column(DataType.UUID)
  declare sceneId: string;

  @ForeignKey(() => WorldEntry)
  @Column(DataType.UUID)
  declare worldEntryId: string;
}
