import { useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router";
import { GridList, GridListItem } from "../rac/GridList";
import { Modal } from "../rac/Modal";
import { ModalOverlay } from "react-aria-components";
import { Button } from "../rac/Button";
import { useTypedLoaderData } from "../hooks/useTypedLoaderData";
import { Expense } from "../loaders/ExpenseLoader";

const PAGE_SIZE = 20;

export const ExpenseListPage = () => {
  const navigate = useNavigate();
  const match = useMatch(`/expense/:id`);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const expenses = useTypedLoaderData(Expense.array());

  return (
    <div>
      <GridList aria-label="Expenses">
        {expenses.slice(0, limit).map((expense) => {
          return (
            <GridListItem
              key={expense.id}
              textValue={expense.name}
              href={`/expense/${expense.id}`}
            >
              {expense.name}
            </GridListItem>
          );
        })}
      </GridList>
      <ModalOverlay
        isOpen={match !== null}
        isDismissable
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            navigate("/expense");
          }
        }}
      >
        <Modal>
          <Outlet />
        </Modal>
      </ModalOverlay>
      <Button onPress={() => setLimit((oldLimit) => oldLimit + PAGE_SIZE)}>
        Load More
      </Button>
    </div>
  );
};
