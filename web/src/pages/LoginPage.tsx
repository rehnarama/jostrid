import { Button } from "@heroui/react";
import { IconBrandWindows } from "@tabler/icons-react";
import { useAuth } from "../hooks/useAuth";

export const LoginPage = () => {
  const { login } = useAuth();

  return (
    <div className="flex h-full w-full items-center justify-center mt-8 page px-2">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <div className="flex flex-col gap-1">
          <h1 className="text-large font-medium">Sign in to your account</h1>
          <p className="text-small text-default-500">to continue to Jostrid</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            startContent={<IconBrandWindows size={36} />}
            variant="bordered"
            as={"a"}
            onPress={() => login()}
          >
            Continue with Microsoft
          </Button>
        </div>
      </div>
    </div>
  );
};
