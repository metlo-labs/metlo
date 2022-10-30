import express from "express"
import { graphqlHTTP } from "express-graphql"
import { buildSchema } from "graphql"
import { v4 as uuidv4 } from "uuid"
import { RandomDie } from "./random-die";
import { Message } from "./message";

var schema = buildSchema(`
  type RandomDie {
    numSides: Int!
    rollOnce: Int!
    roll(numRolls: Int!): [Int]
  }

  input MessageInput {
    content: String
    author: String
  }

  type Message {
    id: ID!
    content: String
    author: String
  }

  type Warehouse {
    uuid: ID!
    name: String
    address: String
  }

  type User {
    uuid: ID!
    firstName: String
    lastName: String
    email: String
    hashedPassword: String
    dob: String
    apiKey: String
    phoneNumber: String
    address: String
  }

  type Cart {
    uuid: ID!
  }

  type Product {
    uuid: ID!
    name: String
    description: String
    price: Float
    warehouse: Warehouse
    owner: User
  }

  type Query {
    hello: String
    getDie(numSides: Int): RandomDie
    getMessage(id: ID!): Message
    getCarts: [Cart]
    getProducts: [Product]
    getCart(uuid: ID!): Cart
    getProduct(uuid: ID!): Product
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
`);

const fakeDatabase = {}
let initId = 0

const root = {
  hello: () => {
    return 'Hello world!';
  },
  getDie: ({numSides}) => {
    return new RandomDie(numSides || 6);
  },
  getMessage: ({id}) => {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    return new Message(id, fakeDatabase[id]);
  },
  getCarts: () => {
    return [... new Array(40)].map(() => ({ uuid: uuidv4() }))
  },
  getProducts: () => {
    return [... new Array(40)].map(() => ({ uuid: uuidv4() }))
  },
  getCart: ({ uuid }) => {
    return {
      uuid,

    }
  },
  getProduct: ({ uuid }) => {
    return {
      uuid,
      name: "This Product",
      description: "Description of Product",
      price: 12.24,
      warehouse: {
        uuid: uuidv4(),
        name: "This Warehouse",
        address: "1234 Fire Ave"
      },
      owner: {
        uuid: uuidv4(),
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@gmail.com",
        hashedPassword: "xfajkdfjsdfsadfsdf",
        dob: "10/02/1993",
        apiKey: "metlo.xyusysdfusdfhsdfjhskjdfhjsdfkj",
        phoneNumber: "1234567890",
        address: "1234 Water Ln"
      }
    }
  },
  createMessage: ({input}) => {
    const id = initId++

    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  updateMessage: ({id, input}) => {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }

    fakeDatabase[id] = input;
    return new Message(id, input);
  },
};

const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
app.listen(8080);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');
