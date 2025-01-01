import { Button } from "@nextui-org/react";
import { IconBrandWindows } from "@tabler/icons-react";

export const LoginPage = () => {
  return (
    <div className="flex h-full w-full items-center justify-center mt-8 page">
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
            href="/oauth/redirect"
          >
            Continue with Microsoft
          </Button>
        </div>
      </div>
    </div>
  );
};
