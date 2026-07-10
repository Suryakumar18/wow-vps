import mongoose, { Document, Model, Schema } from "mongoose";

interface ICharacter { id: string; name: string; color: string; src: string; }
interface ICharacterConfig extends Document { characters: ICharacter[]; }
interface ICharacterConfigModel extends Model<ICharacterConfig> { getConfig(): Promise<ICharacterConfig>; }

const charSchema = new Schema<ICharacter>({ id: { type: String, required: true }, name: { type: String, required: true }, color: { type: String, required: true }, src: { type: String, required: true } });
const schema = new Schema<ICharacterConfig>({ characters: [charSchema] }, { timestamps: true });

const defaultCharacters: ICharacter[] = [
  { id: "1", name: "Avengers", color: "#E62429", src: "http://200.97.164.140/uploads/categories/chars-avengers.avif" },
  { id: "2", name: "Frozen", color: "#00B7FF", src: "http://200.97.164.140/uploads/categories/chars-frozen.avif" },
  { id: "3", name: "Spiderman", color: "#F0131E", src: "http://200.97.164.140/uploads/categories/chars-spiderman.avif" },
  { id: "4", name: "Barbie", color: "#E0218A", src: "http://200.97.164.140/uploads/categories/chars-barbie.avif" },
  { id: "5", name: "Paw Patrol", color: "#005EB8", src: "http://200.97.164.140/uploads/categories/chars-masha.avif" },
  { id: "6", name: "Pokemon", color: "#FFCB05", src: "http://200.97.164.140/uploads/categories/chars-pokemon.avif" },
  { id: "7", name: "Harry Potter", color: "#740001", src: "http://200.97.164.140/uploads/categories/chars-harrypotter.avif" },
  { id: "8", name: "Mickey Mouse", color: "#FFCC00", src: "http://200.97.164.140/uploads/categories/chars-mickey.avif" },
  { id: "9", name: "Disney Princess", color: "#FF69B4", src: "http://200.97.164.140/uploads/categories/chars-princess.avif" },
];

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ characters: defaultCharacters });
  return config;
};

export default (mongoose.models.CharacterConfig as ICharacterConfigModel) || mongoose.model<ICharacterConfig, ICharacterConfigModel>("CharacterConfig", schema);
