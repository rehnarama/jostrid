import { useMe } from "../hooks/useMe";
import { AppCard } from "../components/AppCard";
import { IconMoneybag } from "@tabler/icons-react";
import { Input } from "@nextui-org/react";
import { useCallback, useState } from "react";
import { useToast } from "../hooks/useToast";

export const HomePage = () => {
  const toast = useToast();
  const me = useMe({ suspense: true });
  const [phone, setPhone] = useState(me.data.phone_number ?? "");

  const savePhone = useCallback(() => {
    me.patchMe({ phone_number: phone }).then(() =>
      toast.show("Telefonnummer uppdaterat")
    );
  }, [me, phone, toast]);

  return (
    <div className="p-4 page">
      <h1 className="text-4xl mb-2">Jostrid-webben</h1>
      <p className="mb-2">
        Välkommen, {me.data.name} ({me.data.email}).
      </p>
      <Input
        label="Telefonnummer"
        value={phone}
        onBlur={savePhone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <h2 className="text-2xl mt-2 mb-2">Appar</h2>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <AppCard
          name="Splitten"
          description="Lägg till utgifter"
          to="/expense"
          icon={<IconMoneybag />}
        />
      </div>
    </div>
  );
};
