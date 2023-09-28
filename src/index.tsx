import { html } from "@elysiajs/html";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import * as elements from "typed-html";
import { db } from "./db";
import { Todo, todos } from "./db/schema";

const app = new Elysia()
  .use(html())
  .get('/', ({ html }) => 
    html(
      <BaseHtml>
      <body class='flex w-full h-screen justify-center items-center'
      hx-get="/todos"
      hx-trigger="load"
      hx-swp="innerHTML"
      >
      </body>
      </BaseHtml>
    )
  )
  .get('/todos', async () => {
    const data = await db.select().from(todos).all()
    return <TodoList todos={data} />
  })
  .post(
    "/todos/toggle/:id",
    async ({ params }) => {
      const oldTodo = await db
        .select()
        .from(todos)
        .where(eq(todos.id, params.id))
        .get();
      const newTodo = await db
        .update(todos)
        .set({ completed: !oldTodo?.completed })
        .where(eq(todos.id, params.id))
        .returning()
        .get()
        return <TodoItem {...newTodo} />
      },
      {
        params: t.Object({
          id: t.Numeric(),
        }),
      }
    )
  .delete(
    '/todos/:id', 
    async ({ params }) => {
      await db.delete (todos).where(eq(todos.id, params.id)).run() 
    },
      {
        params: t.Object({
          id: t.Numeric(),
        })
      }
    )
  .post(
    '/todos',
   async ({ body }) => {
      if (body.content.length === 0) {
        throw new Error("Content cannot be empty")
      }
      const newTodo = await db.insert(todos).values(body).returning().get()
      return <TodoItem {...newTodo} />
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )
  .listen(3000)
console.log(`💜 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`)

const BaseHtml = ({ children }: elements.Children) => `
  <!DOCTYPE html>
  <html lang="pt-br">

  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BETH Stack Test</title>
    <script src="https://unpkg.com/htmx.org@1.9.6"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/hyperscript.org@0.9.7"></script>
  </head>

  ${children}
`

function TodoItem({content, completed, id}: Todo) {
  return (
    <div class='flex flex-row space-x-3'>
      <p class={`text-xl ${completed && 'line-through text-gray-400'}`}>{content}</p>
      <input
        type='checkbox' 
        checked={completed} 
        hx-post={`/todos/toggle/${id}`}
        hx-target='closest div'
        hx-swap='outerHTML'
      />
      <button 
        class='text-purple-700'
        hx-delete={`/todos/${id}`}
        hx-target='closest div'
        hx-swap='outerHTML'
      >X</button>
    </div>
  )
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div class="bg-slate-50 rounded shadow p-6 m-4 w-full lg:w-3/4 lg:max-w-lg">
      <div class="mb-4">
        <h1 class="text-slate-900 text-3xl font-bold">Todo List</h1>
      </div>

        {todos.map((todo) => (
          <TodoItem {...todo} />
        ))}
      <TodoForm />
    </div>
  )
}

function TodoForm() {
  return (
         <form 
            class='h-100 w-full flex items-center justify-center'
            hx-post='/todos'
            hx-swap='beforebegin'
            _='on submit target.reset()'
            >
            <div class="flex mt-4 flex-1">
                <input class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-lg" 
                type="text" name="content"
                placeholder="Add Todo" />
                <button  class="flex-no-shrink p-2 border-2 rounded text-lg text-purple-700 border-purple-700 transition-all ease-in-out hover:text-white hover:bg-purple-700" type='submit'>Add</button>
            </div>
       
    </form>
  )
}