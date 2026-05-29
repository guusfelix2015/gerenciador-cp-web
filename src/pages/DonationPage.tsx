import { DonationContent } from "@/components/donation/DonationModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DonationPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Doação</h1>
      <Card>
        <CardHeader>
          <CardTitle>Apoie o Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <DonationContent />
        </CardContent>
      </Card>
    </div>
  );
}
