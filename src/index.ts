import { JSONDB } from "@beforesemicolon/node-json-db";
import http from "http";
import crypto from "crypto";

// Article: https://medium.com/before-semicolon/how-to-create-a-json-database-in-nodejs-from-scratch-8dbd046bddb3

const db = new JSONDB<ToDo>("todo");

export const server = http.createServer(async (req, res) => {
  // handle GET /todos/?:id
  if (req.url === "/todos" && req.method === "GET") {
    await getToDos(req, res);
    return;
  }

  // handle POST /todos
  if (req.url === "/todos" && req.method === "POST") {
    await createToDo(req, res);
    return;
  }

  // handle PUT /todos
  if (req.url?.startsWith("/todos") && req.method === "PUT") {
    await updateToDos(req, res);
    return;
  }

  // handle DELETE /todos
  if (req.url?.startsWith("/todos") && req.method === "DELETE") {
    await deleteToDos(req, res);
    return;
  }

  // handle UNLINK /todos (DROP DATABASE) // todo add auth
  if (req.url?.startsWith("/todos") && req.method === "UNLINK") {
    await dropDatabase(req, res);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      data: "Route not found"
    })
  );
});

type ToDoStatus = "pending" | "completed" | "archived";

interface ToDo {
  id: string;
  name: string;
  status: ToDoStatus;
  user?: {
    name: string;
  };
}

async function createToDo(req: http.IncomingMessage, res: http.ServerResponse) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    let { id, name, status, user } = JSON.parse(body);

    if (id == undefined) {
      id = crypto.randomUUID();
    } else {
      // check if id exists
      const todo = await db.getOne().where("id").equals(id).run();
      if (todo != null) {
        res.writeHead(409, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Id already exists"
          })
        );
        return;
      }
    }

    await db.insert({
      id,
      name,
      status,
      user
    });

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id, name, status, user }));
  });
}

async function getToDos(req: http.IncomingMessage, res: http.ServerResponse) {
  const id = req.url?.split("/")[2];

  if (id != undefined) {
    const todo = await db.getOne().where("id").equals(id).run();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todo));
  } else {
    const todos = await db.getAll().run();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(todos));
  }
}

function updateToDos(req: http.IncomingMessage, res: http.ServerResponse) {
  const id = req.url?.split("/")[2];
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    // This performs a single update.
    // If the body HAS an id, it will update the todo with that id.
    const { id, name, status, user } = JSON.parse(body);
    if (id != undefined) {
      // // This does "additive" updates. It will add fields not currently present in the document.
      // const todo = await db
      //   .updateOne({
      //     name,
      //     status,
      //     user
      //   })
      //   .where("id")
      //   .equals(id)
      //   .run();

      // This does "replace" updates. It will remove fields not present in the update.
      const oldTodo = await db.getOne().where("id").equals(id).run();

      if (oldTodo == null) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Id not found"
          })
        );
        return;
      }

      await db.deleteOne().where("id").equals(id).run();

      const updatedTodo = {
        id,
        name,
        status,
        user
      };
      await db.insert(updatedTodo);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updatedTodo));
    } else {
      // This performs a bulk update.
      // If the body does NOT have an id, it will update all todos that match the search criteria.
      const { field, searchValue, replaceValue } = JSON.parse(body);

      const todos = db
        .updateAll({
          [field]: replaceValue
        })
        .where(field)
        .equals(searchValue)
        .run();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(todos));
    }
  });
}

async function deleteToDos(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    const { id } = JSON.parse(body);
    if (id != undefined) {
      const todo = await db.deleteOne().where("id").equals(id).run();

      if (todo == null) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Id not found"
          })
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(todo));
    } else {
      const { field, searchValue } = JSON.parse(body);

      // check if any matches exist
      const todo = await db.getOne().where(field).equals(searchValue).run();
      if (todo == null) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "No Matches not found"
          })
        );
        return;
      }

      // This performs a bulk delete
      const todos = db.deleteAll().where(field).equals(searchValue).run();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(todos));
    }
  });
}

async function dropDatabase(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  await db.drop();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ data: "Database dropped" }));
}

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000/");
});
