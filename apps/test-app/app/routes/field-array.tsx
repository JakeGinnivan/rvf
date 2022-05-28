import { withZod } from "@remix-validated-form/with-zod";
import { nanoid } from "nanoid";
import { ActionFunction, json } from "remix";
import { FieldArray, ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { Input } from "~/components/Input";

const validator = withZod(
  z.object({
    todos: z.array(
      z.object({
        id: z.string(),
        title: zfd.text(
          z.string({
            required_error: "Title is required",
          })
        ),
        note: zfd.text().optional(),
      })
    ),
  })
);

export const action: ActionFunction = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return json({ message: "Submitted!" });
};

const defaultValues = {
  todos: [
    {
      id: nanoid(),
      title: "Default 1",
      notes: "Default note 1",
    },
    {
      id: nanoid(),
      title: "Default 2",
      notes: "Default note 2",
    },
  ],
};

export default function FrontendValidation() {
  return (
    <ValidatedForm
      validator={validator}
      method="post"
      defaultValues={defaultValues}
    >
      <FieldArray name="todos">
        {(items, { push, remove }) => (
          <>
            {items.map((item, index) => (
              <div key={item.id} data-testid={`todo-${index}`}>
                <input
                  type="hidden"
                  name={`todos[${index}].id`}
                  value={item.id}
                  data-testid="todo-id"
                />
                <Input name={`todos[${index}].title`} label="Title" />
                <Input name={`todos[${index}].notes`} label="Notes" />
                <button
                  onClick={() => {
                    remove(index);
                  }}
                >
                  Delete todo
                </button>
              </div>
            ))}
            <button onClick={() => push({ id: nanoid() })}>Add todo</button>
          </>
        )}
      </FieldArray>
    </ValidatedForm>
  );
}
