import { 
  useGetTopBuyers, 
  useGetTopSellers, 
  useGetVolumeByBreed, 
  useGetVolumeBySpecies 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Loader2, Download, FileSpreadsheet } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = ['hsl(140 30% 45%)', 'hsl(120 25% 60%)', 'hsl(160 35% 40%)', 'hsl(100 20% 50%)', 'hsl(180 30% 40%)'];

export default function Relatorios() {
  const { data: topBuyers, isLoading: loadBuyers } = useGetTopBuyers();
  const { data: topSellers, isLoading: loadSellers } = useGetTopSellers();
  const { data: volumeByBreed, isLoading: loadBreeds } = useGetVolumeByBreed();
  const { data: volumeBySpecies, isLoading: loadSpecies } = useGetVolumeBySpecies();

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = loadBuyers || loadSellers || loadBreeds || loadSpecies;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análises detalhadas de vendas e volumes.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Top Compradores</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleExportCSV(topBuyers || [], 'top_compradores')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Animais</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topBuyers?.map((buyer, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{buyer.nome}</TableCell>
                    <TableCell className="text-right">{buyer.pedidos}</TableCell>
                    <TableCell className="text-right">{buyer.animais}</TableCell>
                    <TableCell className="text-right">{formatCurrency(buyer.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Top Vendedores</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleExportCSV(topSellers || [], 'top_vendedores')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Animais</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellers?.map((seller, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{seller.nome}</TableCell>
                    <TableCell className="text-right">{seller.pedidos}</TableCell>
                    <TableCell className="text-right">{seller.animais}</TableCell>
                    <TableCell className="text-right">{formatCurrency(seller.valor)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume por Raça</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByBreed || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => [value, name === "animais" ? "Animais" : "Valor"]}
                  />
                  <Bar dataKey="animais" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volume por Espécie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={volumeBySpecies || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="animais"
                    nameKey="label"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(volumeBySpecies || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} animais (${formatCurrency(props.payload.valor)})`, 
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
