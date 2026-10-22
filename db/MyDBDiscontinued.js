import { ObjectId } from "mongodb";
import { getDatabase } from "./connection.js";

function MyDBDiscontinued() {
  const me = {};
  const products = () => getDatabase().collection("discontinuedProducts");

  // Jharshini: I like that there's a tie-breaker so items don't repeat/go missing
  me.getProducts = async ({ query = {}, page = 1, pageSize = 20 } = {}) => {
    const [list, total] = await Promise.all([
      products()
        .find(query)
        .sort({ discontinuedDate: -1, _id: 1 }) 
        .skip(pageSize * (page - 1))
        .limit(pageSize)
        .toArray(),
      products().countDocuments(query),
    ]);
    return { products: list, total };
  };

  me.createProduct = (product) => products().insertOne(product);

  me.updateProduct = (id, product) =>
    products().updateOne({ _id: new ObjectId(id) }, { $set: product });

  me.deleteProduct = (id) => products().deleteOne({ _id: new ObjectId(id) });

  return me;
}

export const myDB = MyDBDiscontinued();
