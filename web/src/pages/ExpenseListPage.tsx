import { useMemo, useState } from "react";
import { IconChevronRight, IconPlus } from "@tabler/icons-react";
import {
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListSubheader,
  Sheet,
  Stack,
  Typography,
} from "@mui/joy";
import groupBy from "lodash-es/groupBy";

import classes from "./ExpenseListPage.module.css";
import { Link } from "../components/Link";
import { useExpenses } from "../hooks/useExpenses";
import { NewExpenseModal } from "../components/NewExpenseModal";

const PAGE_SIZE = 10;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const ExpenseListPage = () => {
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const expenses = useExpenses().data;
  const groupedExpenses = useMemo(() => {
    return groupBy(expenses, (expense) => {
      const time = new Date(expense.created_at).getTime();
      return time - (time % DAY_IN_MS);
    });
  }, [expenses]);
  const dates = Object.keys(groupedExpenses).toSorted(
    (a, b) => Number(b) - Number(a)
  );

  return (
    <Sheet className={classes.container}>
      <header className={classes.header}>
        <Stack direction="column" alignItems="flex-start" spacing={1}>
          <Typography level="h1">Utgifter</Typography>
          <Button
            startDecorator={<IconPlus />}
            onClick={() => setNewModalOpen((prev) => !prev)}
          >
            Ny utgift
          </Button>
        </Stack>
      </header>
      <List className={classes.list} sx={{ padding: 0 }}>
        {dates.slice(0, limit).map((date) => {
          const expenses = groupedExpenses[date];
          return (
            <ListItem nested key={date}>
              <ListSubheader sticky>
                {new Date(Number(date)).toLocaleDateString()}
              </ListSubheader>
              <List>
                {expenses.map((expense) => {
                  return (
                    <ListItemButton
                      key={expense.id}
                      component={Link}
                      to={`/expense/${expense.id}`}
                    >
                      <ListItemContent>{expense.name}</ListItemContent>
                      <IconChevronRight />
                    </ListItemButton>
                  );
                })}
              </List>
            </ListItem>
          );
        })}
        {limit < dates.length && (
          <Button
            variant="plain"
            onClick={() => setLimit((oldLimit) => oldLimit + PAGE_SIZE)}
          >
            Load More
          </Button>
        )}
      </List>
      <NewExpenseModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
      />
    </Sheet>
  );
};
