import {
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalDialog,
  Option,
  Select,
  Typography,
} from "@mui/joy";
import { useExpenseCategory } from "../hooks/useExpenseCategory";

export interface NewExpenseModalProps {
  open?: boolean;
  onClose?: () => void;
}

export const NewExpenseModal = (props: NewExpenseModalProps) => {
  const categories = useExpenseCategory();
  return (
    <Modal open={props.open ?? false}>
      <ModalDialog variant="outlined">
        <Typography>Ny utgift</Typography>
        <form>
          <FormControl>
            <FormLabel>Namn</FormLabel>
            <Input name="name" placeholder="T.ex. willys" />
          </FormControl>

          <FormControl>
            <FormLabel>Kategori</FormLabel>
            <Select>
              <Option value="lol" />
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Totalt</FormLabel>
            <Input placeholder="T.ex. willys" />
          </FormControl>
        </form>
      </ModalDialog>
    </Modal>
  );
};
