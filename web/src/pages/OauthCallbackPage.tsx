import { Spinner } from "@heroui/react";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";

export const OauthCallbackPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);
  return (
    <div className="flex flex-col align-middle items-center pt-10 gap-2">
        <p>Setting things up...</p>
      <Spinner />
    </div>
  );
};
