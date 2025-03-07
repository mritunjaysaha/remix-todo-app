import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  Form,
  Link,
  json,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { todos } from "~/lib/db.server";
import { useEffect, useRef } from "react";
import type { Item, View } from "~/types";

import TodoActions from "~/components/TodoActions";
import TodoList from "~/components/TodoList";

export async function loader() {
  return json({ tasks: await todos.read() });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const { intent, ...values } = Object.fromEntries(formData);

  switch (intent) {
    case "create task": {
      const { description } = values;
      return await todos.create(description as string);
    }
    case "toggle completion": {
      const { id, completed } = values;

      return await todos.update(id as string, {
        completed: !JSON.parse(completed as string),
        completedAt: !JSON.parse(completed as string) ? new Date() : undefined,
      });
    }
    case "edit task": {
      const { id } = values;

      return await todos.update(id as string, { editing: true });
    }
    case "save task": {
      const { id, description } = values;
      return await todos.update(id as string, {
        description: description as string,
        editing: false,
      });
    }
    case "delete task": {
      const { id } = values;
      return await todos.delete(id as string);
    }
    case "clear completed": {
      return await todos.clearCompleted();
    }
    case "delete all": {
      return await todos.deleteAll();
    }
    default: {
      throw new Response("Unknown intent", { status: 400 });
    }
  }
}

export const meta: MetaFunction = () => {
  return [
    { title: "Todo App" },
    {
      name: "description",
      content: "A minimalistic todo app built with Remix.",
    },
  ];
};

export default function Home() {
  const { tasks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") || "all";
  const addFormRef = useRef<HTMLFormElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const isAdding =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("intent") === "create task";

  useEffect(() => {
    if (!isAdding) {
      addFormRef.current?.reset();
      addInputRef.current?.focus();
    }
  });

  return (
    <div className="flex flex-1 flex-col md:mx-auto md:w-[720px]">
      <header className="mb-12 flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          TODO
        </h1>
        <select className="appearance-none rounded-3xl border border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <option>System</option>
          <option>Light</option>
          <option>Dark</option>
        </select>
      </header>

      <main className="flex-1 space-y-8">
        <fetcher.Form
          ref={addFormRef}
          method="post"
          className="rounded-full border border-gray-200 bg-white/90 shadow-md dark:border-gray-700 dark:bg-gray-900"
        >
          <fieldset
            disabled={isAdding}
            className="flex items-center gap-2 p-2 text-sm"
          >
            <input
              ref={addInputRef}
              type="text"
              name="description"
              placeholder="Create a new todo..."
              required
              className="flex-1 rounded-full border-2 border-gray-200 px-3 py-2 text-sm font-bold text-black dark:border-white/50"
            />
            <button
              name="intent"
              value="create task"
              className="rounded-full border-2 border-gray-200/50 bg-gradient-to-tl from-[#00fff0] to-[#0083fe] px-3 py-2 text-base font-black transition hover:scale-105 hover:border-gray-500 sm:px-6 dark:border-white/50 dark:from-[#8e0e00] dark:to-[#1f1c18] dark:hover:border-white"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </fieldset>
        </fetcher.Form>

        <div className="rounded-3xl border border-gray-200 bg-white/90 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <TodoList todos={tasks as unknown as Item[]} view={view as View} />{" "}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/90 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <TodoActions tasks={tasks as unknown as Item[]} />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/90 px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
          <Form className="flex items-center justify-center gap-12 text-sm">
            <button
              aria-label="View all tasks"
              className={`transition ${
                view === "all" ? "font-bold" : "opacity-50 hover:opacity-100"
              }`}
              name="view"
              value="all"
            >
              All
            </button>
            <button
              aria-label="View active tasks"
              className={`transition ${
                view === "active" ? "font-bold" : "opacity-50 hover:opacity-100"
              }`}
              name="view"
              value="active"
            >
              Active
            </button>
            <button
              aria-label="View completed"
              className={`transition ${
                view === "completed"
                  ? "font-bold"
                  : "opacity-50 hover:opacity-100"
              }`}
              name="view"
              value="completed"
            >
              Completed
            </button>
          </Form>
        </div>
      </main>

      <footer className="mt-12">
        <p className="text-center text-sm leading-loose">
          Built by{" "}
          <Link
            to="https://udohjeremiah.com"
            target="_blank"
            rel="noopener noreferrer"
            className="relative font-medium text-white after:absolute after:-bottom-0.5 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full dark:text-blue-500 dark:after:bg-blue-500"
          >
            Udoh
          </Link>
          . The source code is available on{" "}
          <Link
            to="https://github.com/udohjeremiah/remix-todo-app"
            target="_blank"
            rel="noopener noreferrer"
            className="relative font-medium text-white after:absolute after:-bottom-0.5 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full dark:text-blue-500 dark:after:bg-blue-500"
          >
            GitHub
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
