import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  ShoppingCart, Boxes, NotebookPen, BarChart3, Trash2, Plus, Minus,
  AlertTriangle, X, Sparkles, LogOut, Users, Truck, Lock, Mail,
} from "lucide-react";

const money = (n) => (n || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const MULTIPLICADORES = { Básico: 2.5, Estándar: 3.5, Premium: 4.5 };
const MOTIVOS_MERMA = ["Caducidad", "Dañado/accidente", "Uso interno/muestra", "Otro"];
const ESTADOS_ENTREGA = ["Pendiente", "En armado", "En proceso de entrega", "Entregado", "Cancelado"];

function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active ? "bg-[#FBF7EF] text-[#5C3A2E]" : "text-[#EADFCB] hover:bg-white/10"
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-20">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
        <h3 className="text-[#3A3226] font-medium mb-2">{title}</h3>
        <p className="text-sm text-[#8A7F6B] mb-4">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border border-[#3A3226]/15 rounded-lg py-2 text-sm">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 bg-[#B23A2E] text-white rounded-lg py-2 text-sm font-medium">Sí, borrar</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- LOGIN ----------------
function Login({ onLoggedIn }) {
  const [correo, setCorreo] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: pw });
    if (error) {
      setError("Correo o contraseña incorrectos.");
      setCargando(false);
      return;
    }
    const { data: perfil, error: perfilError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (perfilError || !perfil) {
      setError("Tu usuario no tiene un perfil configurado. Contacta al administrador.");
      setCargando(false);
      return;
    }
    onLoggedIn(perfil);
  }

  return (
    <div className="min-h-screen bg-[#FBF7EF] flex items-center justify-center p-6" style={{ fontFamily: "'Trebuchet MS', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-[#5C3A2E] text-[#FBF7EF] rounded-2xl p-3 mb-3"><Sparkles size={22} /></div>
          <h1 className="text-xl" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Casa de flores</h1>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-[#3A3226]/8 p-5 space-y-3">
          <div className="flex items-center border border-[#3A3226]/15 rounded-lg px-3 py-2 gap-2">
            <Mail size={15} className="text-[#8A7F6B]" />
            <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Correo" className="w-full text-sm outline-none" />
          </div>
          <div className="flex items-center border border-[#3A3226]/15 rounded-lg px-3 py-2 gap-2">
            <Lock size={15} className="text-[#8A7F6B]" />
            <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Contraseña" className="w-full text-sm outline-none" />
          </div>
          {error && <p className="text-xs text-[#B23A2E]">{error}</p>}
          <button disabled={cargando} type="submit" className="w-full bg-[#5C3A2E] text-[#FBF7EF] rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
            {cargando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------- APP ----------------
export default function App() {
  const [perfil, setPerfil] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [tab, setTab] = useState("ventas");

  const [insumos, setInsumos] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [formulaInsumos, setFormulaInsumos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [mermas, setMermas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
        setPerfil(p || null);
      }
      setCargandoSesion(false);
    });
  }, []);

  useEffect(() => {
    if (perfil) cargarTodo();
  }, [perfil]);

  async function cargarTodo() {
    const [i, f, fi, c, p, v, m] = await Promise.all([
      supabase.from("insumos").select("*").order("nombre"),
      supabase.from("formulas").select("*").order("nombre"),
      supabase.from("formula_insumos").select("*"),
      supabase.from("clientes").select("*").order("nombre"),
      supabase.from("proveedores").select("*").order("nombre_contacto"),
      supabase.from("ventas").select("*, venta_items(*)").order("fecha", { ascending: false }),
      supabase.from("mermas").select("*").order("fecha", { ascending: false }),
    ]);
    setInsumos(i.data || []);
    setFormulas(f.data || []);
    setFormulaInsumos(fi.data || []);
    setClientes(c.data || []);
    setProveedores(p.data || []);
    setVentas(v.data || []);
    setMermas(m.data || []);
    if (perfil?.rol === "Administrador") {
      const { data: u } = await supabase.from("profiles").select("*").order("nombre");
      setUsuarios(u || []);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setPerfil(null);
  }

  if (cargandoSesion) return <div className="min-h-screen bg-[#FBF7EF] flex items-center justify-center text-[#8A7F6B]">Cargando…</div>;
  if (!perfil) return <Login onLoggedIn={setPerfil} />;

  const esAdmin = perfil.rol === "Administrador";
  const flores = insumos.filter((i) => i.tipo === "flor");
  const materiales = insumos.filter((i) => i.tipo === "material");
  const lowStock = insumos.filter((i) => i.stock <= i.minimo);
  const nombreInsumo = (id) => insumos.find((i) => i.id === id)?.nombre || "";
  const insumosDeFormula = (formulaId) => formulaInsumos.filter((fi) => fi.formula_id === formulaId);

  function disponibilidad(formulaId, cantidad) {
    return insumosDeFormula(formulaId).every((fi) => {
      const insumo = insumos.find((i) => i.id === fi.insumo_id);
      return insumo && insumo.stock >= fi.cantidad * cantidad;
    });
  }

  return (
    <div className="min-h-screen bg-[#FBF7EF]" style={{ fontFamily: "'Trebuchet MS', sans-serif" }}>
      <div className="bg-[#5C3A2E] px-6 pt-6 pb-3">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-[#FBF7EF]">
            <Sparkles size={20} />
            <span className="text-lg" style={{ fontFamily: "'Georgia', serif" }}>Casa de flores</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#EADFCB]">{perfil.nombre} · {perfil.rol}</span>
            <button onClick={cerrarSesion} title="Cerrar sesión" className="text-[#EADFCB] hover:text-white"><LogOut size={16} /></button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <Tab active={tab === "ventas"} onClick={() => setTab("ventas")} icon={ShoppingCart} label="Ventas" />
          <Tab active={tab === "inventario"} onClick={() => setTab("inventario")} icon={Boxes} label="Inventario" />
          <Tab active={tab === "formulas"} onClick={() => setTab("formulas")} icon={NotebookPen} label="Fórmulas" />
          <Tab active={tab === "mermas"} onClick={() => setTab("mermas")} icon={Trash2} label="Mermas" />
          <Tab active={tab === "proveedores"} onClick={() => setTab("proveedores")} icon={Truck} label="Proveedores" />
          <Tab active={tab === "reportes"} onClick={() => setTab("reportes")} icon={BarChart3} label="Reportes" />
          {esAdmin && <Tab active={tab === "usuarios"} onClick={() => setTab("usuarios")} icon={Users} label="Usuarios" />}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {tab === "ventas" && (
          <VentasTab
            formulas={formulas} insumos={insumos} clientes={clientes} perfil={perfil}
            disponibilidad={disponibilidad} insumosDeFormula={insumosDeFormula}
            onRecargar={cargarTodo}
          />
        )}
        {tab === "inventario" && (
          <InventarioTab flores={flores} materiales={materiales} lowStock={lowStock} onRecargar={cargarTodo} esAdmin={esAdmin} />
        )}
        {tab === "formulas" && (
          <FormulasTab formulas={formulas} insumos={insumos} insumosDeFormula={insumosDeFormula} nombreInsumo={nombreInsumo} onRecargar={cargarTodo} esAdmin={esAdmin} />
        )}
        {tab === "mermas" && <MermasTab insumos={insumos} mermas={mermas} nombreInsumo={nombreInsumo} perfil={perfil} onRecargar={cargarTodo} />}
        {tab === "proveedores" && <ProveedoresTab proveedores={proveedores} onRecargar={cargarTodo} esAdmin={esAdmin} />}
        {tab === "reportes" && <ReportesTab ventas={ventas} lowStock={lowStock} />}
        {tab === "usuarios" && esAdmin && <UsuariosTab usuarios={usuarios} onRecargar={cargarTodo} />}
      </div>
    </div>
  );
}

// ---------------- VENTAS ----------------
function VentasTab({ formulas, insumos, clientes, perfil, disponibilidad, insumosDeFormula, onRecargar }) {
  const [formulaId, setFormulaId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [extraTipoId, setExtraTipoId] = useState("");
  const [extraCantidad, setExtraCantidad] = useState(1);
  const [extras, setExtras] = useState([]);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [anticipo, setAnticipo] = useState("");
  const [entregaInmediata, setEntregaInmediata] = useState(true);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteDireccion, setClienteDireccion] = useState("");
  const [clienteWhatsapp, setClienteWhatsapp] = useState("");
  const [guardando, setGuardando] = useState(false);

  function agregarFormula() {
    const f = formulas.find((x) => x.id === formulaId);
    if (!f || !disponibilidad(f.id, cantidad)) return;
    setCarrito((c) => {
      const ex = c.find((i) => i.formula_id === f.id);
      if (ex) return c.map((i) => (i.formula_id === f.id ? { ...i, cantidad: i.cantidad + Number(cantidad) } : i));
      return [...c, { formula_id: f.id, nombre: f.nombre, precio: f.precio, cantidad: Number(cantidad) }];
    });
    setFormulaId(""); setCantidad(1);
  }

  function agregarExtra() {
    if (!extraTipoId) return;
    const insumo = insumos.find((i) => i.id === extraTipoId);
    if (!insumo) return;
    const precio = insumo.costo * MULTIPLICADORES["Estándar"];
    setExtras((e) => [...e, { insumo_id: insumo.id, nombre: insumo.nombre, precio, cantidad: Number(extraCantidad) }]);
    setExtraTipoId(""); setExtraCantidad(1);
  }

  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0) + extras.reduce((s, i) => s + i.precio * i.cantidad, 0);

  async function registrarVenta() {
    if (carrito.length === 0 && extras.length === 0) return;
    setGuardando(true);

    let clienteId = null;
    if (clienteNombre.trim()) {
      const existente = clientes.find((c) => c.nombre.toLowerCase() === clienteNombre.trim().toLowerCase());
      if (existente) clienteId = existente.id;
      else {
        const { data } = await supabase.from("clientes").insert({ nombre: clienteNombre, direccion: clienteDireccion, whatsapp: clienteWhatsapp }).select().single();
        clienteId = data?.id || null;
      }
    }

    const { data: venta } = await supabase.from("ventas").insert({
      cliente_id: clienteId,
      usuario_id: perfil.id,
      total,
      metodo_pago: metodoPago,
      anticipo: Number(anticipo) || 0,
      entrega_inmediata: entregaInmediata,
      estado_entrega: entregaInmediata ? null : "Pendiente",
    }).select().single();

    const items = [
      ...carrito.map((c) => ({ venta_id: venta.id, tipo: "formula", formula_id: c.formula_id, precio_unitario: c.precio, cantidad: c.cantidad })),
      ...extras.map((e) => ({ venta_id: venta.id, tipo: "extra", insumo_id: e.insumo_id, precio_unitario: e.precio, cantidad: e.cantidad })),
    ];
    await supabase.from("venta_items").insert(items);

    for (const c of carrito) {
      for (const fi of insumosDeFormula(c.formula_id)) {
        const insumo = insumos.find((i) => i.id === fi.insumo_id);
        await supabase.from("insumos").update({ stock: insumo.stock - fi.cantidad * c.cantidad }).eq("id", fi.insumo_id);
      }
    }
    for (const e of extras) {
      const insumo = insumos.find((i) => i.id === e.insumo_id);
      await supabase.from("insumos").update({ stock: insumo.stock - e.cantidad }).eq("id", e.insumo_id);
    }

    setCarrito([]); setExtras([]); setAnticipo(""); setClienteNombre(""); setClienteDireccion(""); setClienteWhatsapp("");
    setGuardando(false);
    onRecargar();
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 space-y-5">
        <div>
          <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Registrar venta</h2>
          <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4">
            <select value={formulaId} onChange={(e) => setFormulaId(e.target.value)} className="w-full border border-[#3A3226]/15 rounded-lg px-3 py-2.5 text-sm mb-3">
              <option value="">Selecciona un arreglo…</option>
              {formulas.map((f) => (
                <option key={f.id} value={f.id} disabled={!disponibilidad(f.id, 1)}>
                  {f.nombre} — {money(f.precio)}{!disponibilidad(f.id, 1) ? " (sin insumos suficientes)" : ""}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-16 border border-[#3A3226]/15 rounded-lg px-2 py-2 text-sm" />
              <button onClick={agregarFormula} disabled={!formulaId} className="ml-auto bg-[#5C3A2E] text-[#FBF7EF] text-sm px-4 py-2 rounded-lg disabled:opacity-40">Agregar</button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#3A3226] mb-2">Extras del pedido</h3>
          <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4">
            <div className="flex gap-2">
              <select value={extraTipoId} onChange={(e) => setExtraTipoId(e.target.value)} className="flex-1 border border-[#3A3226]/15 rounded-lg px-2 py-2 text-sm">
                <option value="">Selecciona insumo…</option>
                {insumos.map((i) => (<option key={i.id} value={i.id} disabled={i.stock <= 0}>{i.nombre} — {money(i.costo * MULTIPLICADORES["Estándar"])} (stock: {i.stock})</option>))}
              </select>
              <input type="number" min="1" value={extraCantidad} onChange={(e) => setExtraCantidad(e.target.value)} className="w-16 border border-[#3A3226]/15 rounded-lg px-2 py-2 text-sm" />
              <button onClick={agregarExtra} disabled={!extraTipoId} className="bg-[#3A3226]/8 rounded-lg px-3 text-[#5C3A2E] disabled:opacity-40"><Plus size={15} /></button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#3A3226] mb-2">Datos del cliente (opcional)</h3>
          <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4 space-y-2">
            <input placeholder="Nombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className="w-full border border-[#3A3226]/15 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Dirección" value={clienteDireccion} onChange={(e) => setClienteDireccion(e.target.value)} className="w-full border border-[#3A3226]/15 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="WhatsApp" value={clienteWhatsapp} onChange={(e) => setClienteWhatsapp(e.target.value)} className="w-full border border-[#3A3226]/15 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#3A3226] mb-2">Pago y entrega</h3>
          <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4 space-y-2">
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="w-full border border-[#3A3226]/15 rounded-lg px-3 py-2 text-sm">
              <option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option>
            </select>
            <input type="number" placeholder="Anticipo (opcional)" value={anticipo} onChange={(e) => setAnticipo(e.target.value)} className="w-full border border-[#3A3226]/15 rounded-lg px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-[#3A3226]">
              <input type="checkbox" checked={entregaInmediata} onChange={(e) => setEntregaInmediata(e.target.checked)} />
              Entrega inmediata
            </label>
            {!entregaInmediata && <p className="text-xs text-[#8A7F6B]">Este pedido iniciará con estado "Pendiente" para seguimiento.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4 h-fit">
        <h3 className="text-[#3A3226] font-medium mb-3 text-sm">Ticket actual</h3>
        {carrito.length === 0 && extras.length === 0 ? (
          <p className="text-sm text-[#8A7F6B]">Aún no has agregado nada.</p>
        ) : (
          <div className="space-y-2">
            {carrito.map((i) => (<div key={i.formula_id} className="flex justify-between text-sm"><span>{i.cantidad} × {i.nombre}</span><span>{money(i.precio * i.cantidad)}</span></div>))}
            {extras.map((e, idx) => (<div key={idx} className="flex justify-between text-sm text-[#8A7F6B]"><span>{e.cantidad} × {e.nombre}</span><span>{money(e.precio * e.cantidad)}</span></div>))}
            <div className="border-t border-[#3A3226]/8 pt-2 mt-2 flex justify-between text-sm font-medium text-[#3A3226]"><span>Total</span><span>{money(total)}</span></div>
            <button onClick={registrarVenta} disabled={guardando} className="w-full bg-[#5C3A2E] text-[#FBF7EF] rounded-lg py-2 text-sm font-medium mt-2 disabled:opacity-60">
              {guardando ? "Guardando…" : "Registrar venta"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- INVENTARIO ----------------
function InventarioTab({ flores, materiales, lowStock, onRecargar, esAdmin }) {
  const [showAdd, setShowAdd] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: "", unidad: "", costo: "", stock: "", minimo: "" });
  const [ajustar, setAjustar] = useState(null);
  const [ajusteForm, setAjusteForm] = useState({ cantidad: "", costoUnitario: "" });
  const [borrar, setBorrar] = useState(null);

  async function guardarInsumo(e) {
    e.preventDefault();
    await supabase.from("insumos").insert({
      nombre: nuevo.nombre, tipo: showAdd, unidad: nuevo.unidad,
      costo: Number(nuevo.costo), stock: Number(nuevo.stock) || 0, minimo: Number(nuevo.minimo) || 0,
    });
    setNuevo({ nombre: "", unidad: "", costo: "", stock: "", minimo: "" });
    setShowAdd(null);
    onRecargar();
  }

  async function aplicarAjuste(e) {
    e.preventDefault();
    const nuevoStock = ajustar.stock + Number(ajusteForm.cantidad || 0);
    const update = { stock: nuevoStock };
    if (ajusteForm.costoUnitario) update.costo = Number(ajusteForm.costoUnitario);
    await supabase.from("insumos").update(update).eq("id", ajustar.id);
    setAjustar(null); setAjusteForm({ cantidad: "", costoUnitario: "" });
    onRecargar();
  }

  async function confirmarBorrar() {
    await supabase.from("insumos").delete().eq("id", borrar.id);
    setBorrar(null);
    onRecargar();
  }

  function Tabla({ titulo, items }) {
    return (
      <div className="bg-white rounded-2xl border border-[#3A3226]/8 overflow-hidden mb-5">
        <div className="px-4 py-2.5 text-xs font-medium uppercase bg-[#FBEAF0] text-[#993C1D]">{titulo}</div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[#8A7F6B] border-b border-[#3A3226]/8">
            <th className="py-2 px-4">Nombre</th><th className="py-2 px-4">Costo</th><th className="py-2 px-4">Stock</th><th className="py-2 px-4 text-right">Acciones</th>
          </tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-[#3A3226]/8 last:border-0">
                <td className="py-2 px-4">{it.nombre}</td>
                <td className="py-2 px-4 text-[#8A7F6B]">{money(it.costo)}</td>
                <td className="py-2 px-4"><span className={it.stock <= it.minimo ? "text-[#B23A2E] font-medium" : ""}>{it.stock}</span></td>
                <td className="py-2 px-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setAjustar(it)} className="text-[#5C3A2E] p-1"><Plus size={15} /></button>
                    {esAdmin && <button onClick={() => setBorrar(it)} className="text-[#B23A2E] p-1"><Trash2 size={15} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Inventario</h2>
      {lowStock.length > 0 && (
        <div className="flex items-start gap-2 bg-[#FBEAF0] border border-[#F0997B]/40 text-[#4A1B0C] text-sm rounded-xl p-3 mb-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>Stock bajo: {lowStock.map((p) => p.nombre).join(", ")}.</span>
        </div>
      )}
      <div className="flex justify-between mb-2"><span className="text-xs text-[#8A7F6B]">Flores</span><button onClick={() => setShowAdd("flor")} className="text-xs text-[#5C3A2E] font-medium">+ Agregar flor</button></div>
      <Tabla titulo="Flores" items={flores} />
      <div className="flex justify-between mb-2"><span className="text-xs text-[#8A7F6B]">Materiales</span><button onClick={() => setShowAdd("material")} className="text-xs text-[#5C3A2E] font-medium">+ Agregar material</button></div>
      <Tabla titulo="Materiales" items={materiales} />

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10">
          <form onSubmit={guardarInsumo} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex justify-between"><h3 className="font-medium text-[#3A3226]">{showAdd === "flor" ? "Nueva flor" : "Nuevo material"}</h3><button type="button" onClick={() => setShowAdd(null)}><X size={18} /></button></div>
            <input required placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Unidad" value={nuevo.unidad} onChange={(e) => setNuevo({ ...nuevo, unidad: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <input required type="number" placeholder="Costo" value={nuevo.costo} onChange={(e) => setNuevo({ ...nuevo, costo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="number" placeholder="Stock inicial" value={nuevo.stock} onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <input type="number" placeholder="Mínimo de alerta" value={nuevo.minimo} onChange={(e) => setNuevo({ ...nuevo, minimo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <button type="submit" className="w-full bg-[#5C3A2E] text-[#FBF7EF] rounded-lg py-2 text-sm font-medium">Guardar</button>
          </form>
        </div>
      )}

      {ajustar && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-10">
          <form onSubmit={aplicarAjuste} className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <div className="flex justify-between"><h3 className="font-medium text-[#3A3226]">Ajustar — {ajustar.nombre}</h3><button type="button" onClick={() => setAjustar(null)}><X size={18} /></button></div>
            <input type="number" placeholder="Cantidad a ingresar" value={ajusteForm.cantidad} onChange={(e) => setAjusteForm({ ...ajusteForm, cantidad: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Costo unitario nuevo (opcional)" value={ajusteForm.costoUnitario} onChange={(e) => setAjusteForm({ ...ajusteForm, costoUnitario: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <button type="submit" className="w-full bg-[#5C3A2E] text-[#FBF7EF] rounded-lg py-2 text-sm font-medium">Aplicar</button>
          </form>
        </div>
      )}

      {borrar && <ConfirmModal title={`Eliminar "${borrar.nombre}"`} message="Esta acción no se puede deshacer. ¿Confirmas?" onConfirm={confirmarBorrar} onCancel={() => setBorrar(null)} />}
    </div>
  );
}

// ---------------- FORMULAS ----------------
function FormulasTab({ formulas, insumos, insumosDeFormula, nombreInsumo, onRecargar, esAdmin }) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Estándar");
  const [precio, setPrecio] = useState("");
  const [items, setItems] = useState([]);
  const [insumoSel, setInsumoSel] = useState("");
  const [cantSel, setCantSel] = useState(1);
  const [borrar, setBorrar] = useState(null);

  function addItem() {
    if (!insumoSel) return;
    setItems((it) => [...it.filter((x) => x.insumo_id !== insumoSel), { insumo_id: insumoSel, cantidad: Number(cantSel) }]);
    setInsumoSel(""); setCantSel(1);
  }

  const costoBase = items.reduce((s, it) => s + (insumos.find((i) => i.id === it.insumo_id)?.costo || 0) * it.cantidad, 0);
  const sugerido = costoBase * MULTIPLICADORES[categoria];

  async function guardar(e) {
    e.preventDefault();
    const { data: f } = await supabase.from("formulas").insert({ nombre, categoria, precio: Number(precio) }).select().single();
    await supabase.from("formula_insumos").insert(items.map((it) => ({ formula_id: f.id, insumo_id: it.insumo_id, cantidad: it.cantidad })));
    setNombre(""); setPrecio(""); setItems([]);
    onRecargar();
  }

  async function confirmarBorrar() {
    await supabase.from("formulas").delete().eq("id", borrar.id);
    setBorrar(null);
    onRecargar();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Arreglos guardados</h2>
        <div className="space-y-3">
          {formulas.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-[#3A3226]/8 p-4">
              <div className="flex justify-between mb-1">
                <p className="font-medium text-sm">{f.nombre} <span className="text-xs text-[#8A7F6B] font-normal">({f.categoria})</span></p>
                <div className="flex items-center gap-2"><p className="text-sm text-[#8A7F6B]">{money(f.precio)}</p>{esAdmin && <button onClick={() => setBorrar(f)} className="text-[#B23A2E]"><Trash2 size={14} /></button>}</div>
              </div>
              <p className="text-xs text-[#8A7F6B]">{insumosDeFormula(f.id).map((fi) => `${fi.cantidad} ${nombreInsumo(fi.insumo_id)}`).join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Armar nuevo arreglo</h2>
        <form onSubmit={guardar} className="bg-white rounded-2xl border border-[#3A3226]/8 p-4 space-y-3">
          <input required placeholder="Nombre del arreglo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <select value={insumoSel} onChange={(e) => setInsumoSel(e.target.value)} className="flex-1 border rounded-lg px-2 py-2 text-sm">
              <option value="">Selecciona insumo…</option>
              {insumos.map((i) => (<option key={i.id} value={i.id}>{i.nombre}</option>))}
            </select>
            <input type="number" min="0" step="0.5" value={cantSel} onChange={(e) => setCantSel(e.target.value)} className="w-16 border rounded-lg px-2 py-2 text-sm" />
            <button type="button" onClick={addItem} className="bg-[#3A3226]/8 rounded-lg px-2.5"><Plus size={15} /></button>
          </div>
          {items.map((it) => (<div key={it.insumo_id} className="text-xs flex justify-between"><span>{it.cantidad} de {nombreInsumo(it.insumo_id)}</span></div>))}
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            {Object.keys(MULTIPLICADORES).map((c) => (<option key={c}>{c}</option>))}
          </select>
          <p className="text-xs text-[#8A7F6B]">Costo insumos: {money(costoBase)} · Sugerido: <b>{money(sugerido)}</b></p>
          <input required type="number" placeholder="Precio final de venta" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="w-full bg-[#5C3A2E] text-[#FBF7EF] rounded-lg py-2 text-sm font-medium">Guardar arreglo</button>
        </form>
      </div>
      {borrar && <ConfirmModal title={`Eliminar "${borrar.nombre}"`} message="El arreglo dejará de estar disponible para venta. ¿Confirmas?" onConfirm={confirmarBorrar} onCancel={() => setBorrar(null)} />}
    </div>
  );
}

// ---------------- MERMAS ----------------
function MermasTab({ insumos, mermas, nombreInsumo, perfil, onRecargar }) {
  const [insumoId, setInsumoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS_MERMA[0]);

  async function registrar(e) {
    e.preventDefault();
    const insumo = insumos.find((i) => i.id === insumoId);
    if (!insumo || !cantidad) return;
    await supabase.from("insumos").update({ stock: Math.max(0, insumo.stock - Number(cantidad)) }).eq("id", insumoId);
    await supabase.from("mermas").insert({ insumo_id: insumoId, usuario_id: perfil.id, cantidad: Number(cantidad), motivo });
    setInsumoId(""); setCantidad("");
    onRecargar();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Registrar merma</h2>
        <form onSubmit={registrar} className="bg-white rounded-2xl border border-[#3A3226]/8 p-4 space-y-3">
          <select required value={insumoId} onChange={(e) => setInsumoId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Selecciona insumo…</option>
            {insumos.map((i) => (<option key={i.id} value={i.id}>{i.nombre} (stock: {i.stock})</option>))}
          </select>
          <input required type="number" placeholder="Cantidad a dar de baja" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
            {MOTIVOS_MERMA.map((m) => (<option key={m}>{m}</option>))}
          </select>
          <button type="submit" className="w-full bg-[#5C3A2E] text-[#FBF7EF] rounded-lg py-2 text-sm font-medium">Registrar y descontar</button>
        </form>
      </div>
      <div>
        <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Historial</h2>
        <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4 space-y-2">
          {mermas.length === 0 ? <p className="text-sm text-[#8A7F6B]">Sin registros.</p> : mermas.map((m) => (
            <div key={m.id} className="text-sm border-b border-[#3A3226]/8 last:border-0 pb-2">
              <div className="flex justify-between"><span>{m.cantidad} de {nombreInsumo(m.insumo_id)}</span></div>
              <p className="text-xs text-[#8A7F6B]">{m.motivo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- PROVEEDORES ----------------
function ProveedoresTab({ proveedores, onRecargar, esAdmin }) {
  const [form, setForm] = useState({ nombre_contacto: "", telefono: "", correo: "", productos_descripcion: "" });
  const [borrar, setBorrar] = useState(null);

  async function guardar(e) {
    e.preventDefault();
    await supabase.from("proveedores").insert(form);
    setForm({ nombre_contacto: "", telefono: "", correo: "", productos_descripcion: "" });
    onRecargar();
  }

  async function confirmarBorrar() {
    await supabase.from("proveedores").delete().eq("id", borrar.id);
    setBorrar(null);
    onRecargar();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Proveedores</h2>
        <div className="space-y-3">
          {proveedores.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#3A3226]/8 p-4">
              <div className="flex justify-between"><p className="font-medium text-sm">{p.nombre_contacto}</p>{esAdmin && <button onClick={() => setBorrar(p)} className="text-[#B23A2E]"><Trash2 size={14} /></button>}</div>
              <p className="text-xs text-[#8A7F6B]">{p.telefono} {p.correo && "· " + p.correo}</p>
              <p className="text-xs text-[#8A7F6B] mt-1">{p.productos_descripcion}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Agregar proveedor</h2>
        <form onSubmit={guardar} className="bg-white rounded-2xl border border-[#3A3226]/8 p-4 space-y-3">
          <input required placeholder="Nombre de contacto" value={form.nombre_contacto} onChange={(e) => setForm({ ...form, nombre_contacto: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Correo" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <textarea placeholder="Productos que maneja" value={form.productos_descripcion} onChange={(e) => setForm({ ...form, productos_descripcion: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="w-full bg-[#5C3A2E] text-[#FBF7EF] rounded-lg py-2 text-sm font-medium">Guardar</button>
        </form>
      </div>
      {borrar && <ConfirmModal title={`Eliminar "${borrar.nombre_contacto}"`} message="¿Confirmas eliminar este proveedor?" onConfirm={confirmarBorrar} onCancel={() => setBorrar(null)} />}
    </div>
  );
}

// ---------------- REPORTES ----------------
function ReportesTab({ ventas, lowStock }) {
  const today = new Date().toISOString().slice(0, 10);
  const ventasHoy = ventas.filter((v) => v.fecha.slice(0, 10) === today);
  const totalHoy = ventasHoy.reduce((s, v) => s + Number(v.total), 0);

  return (
    <div>
      <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Reportes</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4"><p className="text-xs text-[#8A7F6B] mb-1">Ventas de hoy</p><p className="text-xl font-medium">{money(totalHoy)}</p></div>
        <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4"><p className="text-xs text-[#8A7F6B] mb-1">Tickets de hoy</p><p className="text-xl font-medium">{ventasHoy.length}</p></div>
        <div className="bg-white rounded-2xl border border-[#3A3226]/8 p-4"><p className="text-xs text-[#8A7F6B] mb-1">Insumos con stock bajo</p><p className="text-xl font-medium text-[#B23A2E]">{lowStock.length}</p></div>
      </div>
    </div>
  );
}

// ---------------- USUARIOS ----------------
function UsuariosTab({ usuarios, onRecargar }) {
  async function cambiarRol(id, rol) {
    await supabase.from("profiles").update({ rol }).eq("id", id);
    onRecargar();
  }
  return (
    <div>
      <h2 className="text-[19px] font-medium mb-3" style={{ fontFamily: "'Georgia', serif", color: "#3A3226" }}>Usuarios</h2>
      <div className="bg-white rounded-2xl border border-[#3A3226]/8 divide-y divide-[#3A3226]/8">
        {usuarios.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4">
            <span className="text-sm">{u.nombre}</span>
            <select value={u.rol} onChange={(e) => cambiarRol(u.id, e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
              <option>Administrador</option><option>Vendedor</option>
            </select>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#8A7F6B] mt-3">
        Para crear un usuario nuevo o resetear su contraseña, por ahora hazlo desde el panel de Supabase (Authentication → Users). Más adelante podemos agregar esa función aquí mismo con una Edge Function.
      </p>
    </div>
  );
}
