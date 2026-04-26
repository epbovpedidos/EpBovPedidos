import { 
  useGetDashboardSummary, 
  useGetVolumeByBuyer, 
  useGetVolumeBySpecies, 
  useGetVolumeByBreed, 
  useGetVolumeByAgeRange, 
  useGetMonthlySales,
  useGetRecentOrders 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { FileText, DollarSign, Users, Target, Loader2, ArrowRight } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

const COLORS = ['hsl(140 30% 45%)', 'hsl(120 25% 60%)', 'hsl(160 35% 40%)', 'hsl(100 20% 50%)', 'hsl(180 30% 40%)'];

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: volumeByBuyer } = useGetVolumeByBuyer();
  const { data: volumeBySpecies } = useGetVolumeBySpecies();
  const { data: volumeByBreed } = useGetVolumeByBreed();
  const { data: volumeByAge } = useGetVolumeByAgeRange();
  const { data: monthlySales } = useGetMonthlySales();
  const { data: recentOrders } = useGetRecentOrders();

  if (loadingSummary) {
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema de vendas.</p>
        </div>
        <Link href="/pedidos/novo">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            Novo Pedido
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPedidos || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.pedidosMes || 0} neste mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Animais</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalAnimais || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Negociados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Movimentado</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalValor || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary?.valorMes || 0)} neste mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.totalCompradores || 0) + (summary?.totalVendedores || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalCompradores || 0} Compradores / {summary?.totalVendedores || 0} Vendedores
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas Mensais</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales || []} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === "valor") return [formatCurrency(value), "Valor"];
                      return [value, "Animais"];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="valor" />
                  <Line yAxisId="right" type="monotone" dataKey="animais" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} name="animais" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
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
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="animais"
                    nameKey="label"
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
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {(volumeBySpecies || []).map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground">{entry.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Últimos Pedidos Emitidos</CardTitle>
          <Link href="/pedidos">
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido emitido recentemente.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Animais</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/pedidos/${order.id}`}>
                          <a className="text-primary hover:underline">{order.numero}</a>
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(order.dataEmissao)}</TableCell>
                      <TableCell>{order.compradorNome}</TableCell>
                      <TableCell>{order.vendedorNome}</TableCell>
                      <TableCell className="text-right">{order.totalAnimais}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.totalValor)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'rascunho' ? 'secondary' : 'default'} className="font-normal">
                          {order.status === 'rascunho' ? 'Rascunho' : 'Emitido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
