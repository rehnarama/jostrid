import { useMe } from "../hooks/useMe";
import { AppCard } from "../components/AppCard";
import { IconMoneybag } from "@tabler/icons-react";

export const HomePage = () => {
  const me = useMe({ suspense: true });

  return (
    <div className="p-4 page">
      <h1 className="text-4xl mb-2">Jostrid-webben</h1>
      <p className="mb-2">
        Välkommen, {me.data.name} ({me.data.email}).
      </p>

      <h2 className="text-2xl mt-2 mb-2">Appar</h2>

      <div className="grid gap-3 grid-cols-3 md:grid-cols-5">
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
