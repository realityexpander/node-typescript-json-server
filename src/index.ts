import { JSONDB } from "@beforesemicolon/node-json-db/src/index.js";
import http from "http";
import crypto, { randomUUID } from "crypto";
const formidable = require("formidable");
import uuidv4 from "uuid4";
import fs from "fs/promises";
import { File } from "formidable";
// Article: https://medium.com/before-semicolon/how-to-create-a-json-database-in-nodejs-from-scratch-8dbd046bddb3
import slugify from "slugify";

// @ts-ignore // needed for regular js files
import HelloWorld from "./hello-world.js";

// @ts-ignore
import WebComponentSSR from "./web-components/web-component-ssr.js";

// console
// .log
// HelloWorld({
//   html: (data) => "<html><body>" + data + "</body></html>",
//   state: { attrs: { greeting: "Hello World" } }
// })
// ();

/**
 * Import '@enhance' pure-js ES-Module into CommonJS Node.js module
 */
(async () => {
  const { default: enhance } = await (eval(
    `import("@enhance/ssr/index.mjs")`
  ) as Promise<typeof import("@enhance/ssr/index.mjs")>);

  // const html = enhance({
  //   elements: {
  //     "hello-world": HelloWorld
  //   }
  // });
  // const res = html`<hello-world greeting="fuck">
  //   Well hello there!
  // </hello-world>`;
  // console.log(res);
  // console.log();

  // generate random class ID map for components
  const componentStyleIdMap = {};
  componentStyleIdMap["web-component"] = createStyleId("web-component");
  componentStyleIdMap["hello-world"] = createStyleId("hello-world");

  const html2 = enhance({
    elements: {
      "web-component": WebComponentSSR,
      "hello-world": HelloWorld
    },
    scriptTransforms: [
      function ({ attrs, raw }) {
        // raw is the raw text from inside the script tag
        // attrs are the attributes from the script tag
        return raw;
      }
    ],
    styleTransforms: [
      function (data) {
        // `attrs` is array of the attributes {name,value} from the style tag.
        // `tagName` is the name of the html element.
        const { tagName, attrs } = data;

        // raw is the raw text from inside the style tag
        const { raw } = data;
        let transformedStyle: string = raw; // default to raw string

        const attrsLookup = getAttrsLookupTable(attrs);
        const scope = attrsLookup["scope"]; // check scope of css: 'global', 'component'

        if (scope == "component") {
          transformedStyle = replaceHostWithGeneratedClassId(
            raw,
            componentStyleIdMap[tagName]
          );
        }

        return `
        /* Component: ${tagName} */
        /* attrs: ${JSON.stringify(attrs)} */
        /* Scope: ${scope} */
        ${transformedStyle}
        `;
      }
    ]
  });

  // This is the HTML that will be rendered on the server
  const res2 = html2`
    <head>
      <meta charset="UTF-8" />
    </head>

    <style>
      :root {
        background-color: black;
        color: white;
      }
    </style>
      
    <web-component 
      class="${componentStyleIdMap["web-component"]}"
      params="ssr_hello">
      <slot id="main"><button>OK</button>Content for Slots from Main HTML</slot>
    </web-component>

    <hello-world class="${componentStyleIdMap["hello-world"]}">
      Server Rendered Content
    </hello-world>
  `;
  console.log(res2);

  // write res2 to file
  await fs.writeFile("./src/index-res2.html", res2);
})();

function getAttrsLookupTable(attrs: any[]) {
  return attrs.reduce((acc, { name, value }) => {
    acc[name] = value;
    return acc;
  }, {});
}

// replace `:host:` with the generated class id
function replaceHostWithGeneratedClassId(raw: string, id: string) {
  return raw.replace(/:host /g, `.${id} `);
}

// generate random class ID for components
function createStyleId(tagName = "") {
  return "ssr_" + tagName + "_" + randomUUID();
}

import type {
  EnhanceElemArg,
  EnhanceElemFn,
  EnhanceHtmlFn,
  EnhanceElemResult
} from "@enhance/types";

const db = new JSONDB<ToDo>("todo");

export const server = http.createServer(async (req, res) => {
  console.log(req.method, req.url, req.headers);

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");

  // GET /todos/search
  // Note: more specific routes should be before less specific routes
  if (req.url?.startsWith("/todos/search") && req.method === "GET") {
    try {
      await searchTodos(req, res);
      return;
    } catch (error: any) {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
    }
  }

  // GET /todos/?:id
  // note: needs trailing slash bc there are optional params
  if (req.url?.startsWith("/todos") && req.method === "GET") {
    try {
      await getToDos(req, res);
      return;
    } catch (error: any) {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
    }
  }

  // POST /todos
  if (req.url === "/todos" && req.method === "POST") {
    try {
      await createToDo(req, res);
      return;
    } catch (error: any) {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
    }
  }

  // PUT /todos
  if (req.url?.startsWith("/todos") && req.method === "PUT") {
    try {
      await updateToDos(req, res);
      return;
    } catch (error: any) {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
    }
  }

  // DELETE /todos
  if (req.url?.startsWith("/todos") && req.method === "DELETE") {
    try {
      await deleteToDos(req, res);
      return;
    } catch (error: any) {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
    }
  }

  // UNLINK /todos (DROP DATABASE) // TODO add auth
  if (req.url?.startsWith("/todos") && req.method === "UNLINK") {
    try {
      await dropDatabase(req, res);
      return;
    } catch (error: any) {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
    }
  }

  // POST /upload
  if (req.url?.startsWith("/upload") && req.method === "POST") {
    try {
      await uploadFiles(req, res);
      return;
    } catch (error: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
    }
  }

  // GET /uploads
  if (req.url?.startsWith("/uploads") && req.method === "GET") {
    try {
      await getUploads(req, res);
      return;
    } catch (error: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
      console.log(error);
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      data: "Route not found"
    })
  );
});

type ToDoStatus1 = "pending" | "completed" | "archived";

enum ToDoStatus {
  pending = "pending",
  completed = "completed",
  archived = "archived"
}

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

async function searchTodos(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    const { field, searchValue } = JSON.parse(body);

    if (field == undefined || searchValue == undefined) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Missing field or value parameters."
        })
      );
      return;
    }

    if (field != undefined && searchValue != undefined) {
      console.log("searching for", searchValue, "in", field);
      // const todos = await db.getAll().where(field).in(searchValue).run();
      //where.match(/world/)
      const searchRegex = new RegExp(searchValue, "i");
      // const todos = await db.getAll().where(field).matches(searchRegex).run();

      // using new contains() method
      const todos = await db.getAll().where(field).in(searchValue).run();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(todos));
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "No data found"
        })
      );
    }
  });
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

async function uploadFiles(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const form = new formidable.IncomingForm({
    multiples: true,
    keepExtensions: true,
    uploadDir: "./uploads"
  });

  form.parse(
    req,
    async (
      err: any,
      fields: { name: any; status: any; user: any },
      files: { [fileKey: string]: File }
    ) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Error parsing form"
          })
        );
        return;
      }

      const id = uuidv4();
      const { name, status, user } = fields;
      const fileList = Object.keys(files);

      // Download and save file(s) to a local folder
      const uploadedFiles: string[] = [];
      for (const file of fileList) {
        // const oldpath = file.filepath;
        // const newpath = "./uploads/" + file.originalFilename;
        const oldpath = files[file].filepath;
        const slugFilename = slugify(files[file].originalFilename!, {
          replacement: "-", // replace spaces with replacement character, defaults to `-`
          remove: undefined, // remove characters that match regex, defaults to `undefined`
          lower: false, // convert to lower case, defaults to `false`
          strict: false, // strip special characters except replacement, defaults to `false`
          locale: "en", // language code of the locale to use
          trim: true // trim leading and trailing replacement chars, defaults to `true`
        });
        const newpath = "./uploads/" + slugFilename;

        // Check if File already exists
        try {
          await fs.access(newpath);
          // throw new Error("File already exists");
          console.log(
            "File already exists -- " + newpath + " -- deleting cached upload"
          );
          await fs.unlink(oldpath);
          continue;
        } catch (err: any) {
          // File does not exist
          console.log("File does not exist -- " + newpath + " -- saving");
        }

        try {
          await fs.rename(oldpath, newpath);
        } catch (err: any) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Error saving file: " + err.message
            })
          );
          return;
        }

        uploadedFiles.push(newpath);
      }

      const todo = {
        id,
        name,
        status,
        user: { ...user, files: uploadedFiles, ...fields }
      };
      await db.insert(todo);

      const uploadResult = {
        todo,
        uploadedFiles
      };

      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify(uploadResult));
    }
  );
}

async function getUploads(req: http.IncomingMessage, res: http.ServerResponse) {
  // get filename from url
  const filename = req.url?.split("/")[2];

  if (filename != undefined) {
    // get file from uploads folder
    const file = await fs.readFile("./uploads/" + filename);

    // return as file download
    // res.writeHead(200, { "Content-Type": "application/octet-stream" });
    // res.end(file);

    // return as image
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(file, "binary");

    return;
  }

  const uploads = await fs.readdir("./uploads");

  const links = uploads.map((upload) => {
    return {
      link: `http://localhost:3000/uploads/${upload}`,
      name: upload
    };
  });

  // // return an html snippet with links to files
  // res.writeHead(200, { "Content-Type": "text/html" });
  // res.end(
  //   links
  //     .map((link) => {
  //       return `<a href="${link.link}">${link.name}</a>`;
  //     })
  //     .join("<br>")
  // );

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(links));
}

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000/");
});
