import { useMe } from "../hooks/useMe";
import { AppCard } from "../components/AppCard";
import { IconMoneybag } from "@tabler/icons-react";
import { addToast, Card, CardFooter, Input } from "@heroui/react";
import { CSSProperties, useCallback, useState } from "react";
import cat0 from "../assets/cats/cat0.jpg";
import cat1 from "../assets/cats/cat1.jpg";
import cat2 from "../assets/cats/cat2.jpg";
import cat3 from "../assets/cats/cat3.jpg";
import cat4 from "../assets/cats/cat4.jpg";
import cat5 from "../assets/cats/cat5.jpg";
import cat6 from "../assets/cats/cat6.jpg";
import cat7 from "../assets/cats/cat7.jpg";
import cat8 from "../assets/cats/cat8.jpg";
import cat9 from "../assets/cats/cat9.jpg";
import cat10 from "../assets/cats/cat10.jpg";
import cat11 from "../assets/cats/cat11.jpg";
import cat12 from "../assets/cats/cat12.jpg";

const catImages = [
  cat0,
  cat1,
  cat2,
  cat3,
  cat4,
  cat5,
  cat6,
  cat7,
  cat8,
  cat9,
  cat10,
  cat11,
  cat12,
];
const catIndex = Math.floor(Math.random() * catImages.length);

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
