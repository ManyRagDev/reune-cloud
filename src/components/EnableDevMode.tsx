import { useEffect } from "react";

export const EnableDevMode = () => {
    useEffect(() => {
        localStorage.setItem("reune_dev_mode", "true");
        // Force a reload to ensure the new route configuration is loaded
        window.location.href = "/";
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <p>Ativando modo de teste...</p>
        </div>
    );
};
