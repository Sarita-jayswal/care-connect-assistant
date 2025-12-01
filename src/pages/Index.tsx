import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { role, user } = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Healthcare Portal</CardTitle>
          <CardDescription>
            You are logged in as {role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {role === "staff" ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                You have access to all patient data, appointments, and tasks.
              </p>
              <p className="text-sm text-muted-foreground">
                Use the sidebar to navigate to different sections.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                View your appointments and follow-up tasks.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
