import { MongoBinary } from "mongodb-memory-server-core";

// Descarga el binario una vez antes de los workers: en paralelo compiten por el mismo .tgz.
export default async function setup() {
  await MongoBinary.getPath();
}
