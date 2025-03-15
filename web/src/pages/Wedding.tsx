import { useMe } from "../hooks/useMe";
import { AppCard } from "../components/AppCard";
import { IconMoneybag } from "@tabler/icons-react";
import { addToast, Card, CardFooter, Input } from "@heroui/react";
import { CSSProperties, useCallback, useState } from "react";

export const HomePage = () => {
  const me = useMe({ suspense: true });
  const [phone, setPhone] = useState(me.data.phone_number ?? "");

  const savePhone = useCallback(() => {
    me.patchMe({ phone_number: phone }).then(() =>
      addToast({
        title: "Telefonnummer uppdaterat",
        color: "success",
      }),
    );
  }, [me, phone]);

  return (
    <div className="p-4 page">
      <Card className="max-h-60" isFooterBlurred>
        <img
          src={catImages[catIndex]}
          alt="Image of a cat"
          className="object-cover object-center h-full w-full"
        />
        <CardFooter
          className="bg-white/60 absolute left-2 bottom-2 right-2 p-0 w-auto rounded-md"
          style={
            {
              ["--heroui-default-100-opacity"]: 0.1,
            } as CSSProperties
          }
        >
          <Input
            label="Telefonnummer"
            value={phone}
            onBlur={savePhone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </CardFooter>
      </Card>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mt-2">
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
