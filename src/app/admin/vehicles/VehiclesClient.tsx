"use client";

import { useState, useTransition, useEffect } from "react";
import styles from "./vehicles.module.css";
import { Plus, Search, Edit2, Trash2, X, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { createVehicle, updateVehicle, deleteVehicle } from "@/actions/autoActions";
import Link from "next/link";
import MediaUpload, { type MediaItem } from "./MediaUpload";
import { useSearchParams, useRouter } from "next/navigation";
import { updateAgencySettings } from "@/actions/agencyActions";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  kms: number;
  transmission: "manual" | "automatica";
  fuel: "nafta" | "diesel" | "hibrido" | "electrico";
  price: number;
  currency: string;
  color?: string;
  engine?: string;
  doors?: number;
  plate?: string;
  description?: string;
  images: string[];
  videos?: string[];
  youtube_videos?: string | null;
  status: "disponible" | "reservado" | "vendido";
}

interface VehiclesClientProps {
  initialVehicles: Vehicle[];
  initialPublishSold: boolean;
}

const emptyFormState = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  kms: 0,
  transmission: "manual" as "manual" | "automatica",
  fuel: "nafta" as "nafta" | "diesel" | "hibrido" | "electrico",
  price: 0,
  currency: "USD",
  color: "",
  engine: "",
  doors: 5,
  plate: "",
  description: "",
  status: "disponible" as "disponible" | "reservado" | "vendido",
};

export default function VehiclesClient({ initialVehicles, initialPublishSold }: VehiclesClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formState, setFormState] = useState(emptyFormState);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [publishSold, setPublishSold] = useState(initialPublishSold);
  
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      openNewModal();
      // clean params
      router.replace("/admin/vehicles");
    }
  }, [searchParams]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      (v.plate && v.plate.toLowerCase().includes(search.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openNewModal = () => {
    setFormState(emptyFormState);
    setEditingVehicle(null);
    setMediaItems([]);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormState({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      kms: vehicle.kms,
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
      price: vehicle.price,
      currency: vehicle.currency,
      color: vehicle.color || "",
      engine: vehicle.engine || "",
      doors: vehicle.doors || 5,
      plate: vehicle.plate || "",
      description: vehicle.description || "",
      status: vehicle.status,
    });

    // Parse existing media items
    const items: MediaItem[] = [];
    const ytStr = vehicle.youtube_videos;
    
    if (ytStr && typeof ytStr === "string") {
      try {
        const parsed = JSON.parse(ytStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.type === "youtube") {
              items.push({ kind: "youtube", youtubeUrl: item.url, youtubeEmbedId: item.embedId });
            } else if (item.type === "image") {
              items.push({ kind: "existing", url: item.url, isVideo: false });
            } else if (item.type === "video") {
              items.push({ kind: "existing", url: item.url, isVideo: true });
            }
          });
        }
      } catch (e) {}
    }

    if (items.length === 0) {
      if (vehicle.images && vehicle.images.length > 0) {
        vehicle.images.forEach((img: string) => {
          items.push({ kind: "existing", url: img, isVideo: false });
        });
      }
      if (vehicle.videos && vehicle.videos.length > 0) {
        vehicle.videos.forEach((vid: string) => {
          items.push({ kind: "existing", url: vid, isVideo: true });
        });
      }
    }

    setMediaItems(items);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este vehículo de forma permanente?")) {
      const res = await deleteVehicle(id);
      if (res.success) {
        setVehicles(prev => prev.filter(v => v.id !== id));
      } else {
        alert("Error al eliminar el vehículo: " + res.error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    
    // Append files from MediaUpload
    mediaItems.forEach((item) => {
      if (item.kind === "file" && item.file) {
        formData.append("media", item.file);
      }
    });

    // Construct the layout config JSON payload
    const mediaLayout = mediaItems.map((item) => {
      if (item.kind === "youtube") {
        return { kind: "youtube", url: item.youtubeUrl, embedId: item.youtubeEmbedId };
      }
      if (item.kind === "file" && item.file) {
        return { kind: "file", fileType: item.file.type.startsWith("video/") ? "video" : "image" };
      }
      if (item.kind === "existing") {
        return { kind: "existing", url: item.url, isVideo: item.isVideo };
      }
      return null;
    }).filter(Boolean);

    formData.append("media_layout", JSON.stringify(mediaLayout));
    
    startTransition(async () => {
      if (editingVehicle) {
        const res = await updateVehicle(editingVehicle.id, formData);
        if (res.success && res.data) {
          setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? res.data as Vehicle : v));
          setShowModal(false);
        } else if (res.error) {
          setErrors(res.error as any);
        }
      } else {
        const res = await createVehicle(formData);
        if (res.success && res.data) {
          setVehicles(prev => [res.data as Vehicle, ...prev]);
          setShowModal(false);
        } else if (res.error) {
          setErrors(res.error as any);
        }
      }
    });
  };

  return (
    <div className={styles.propertiesContainer}>
      <div className={styles.header}>
        <div>
          <h1>Inventario de Vehículos</h1>
          <p>Gestiona el stock del concesionario de autos.</p>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={openNewModal}>
          <Plus size={16} /> Agregar Auto
        </button>
      </div>

      {/* Filters bar */}
      <div className={styles.filters}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por marca, modelo o patente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="disponible">Disponibles</option>
          <option value="reservado">Reservados</option>
          <option value="vendido">Vendidos</option>
        </select>
      </div>

      {/* Publish Sold checkbox */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "-0.5rem", marginBottom: "1.25rem", justifyContent: "flex-end", fontSize: "0.85rem", fontWeight: "600" }}>
        <input 
          type="checkbox"
          id="publishSoldCheckbox"
          checked={publishSold}
          onChange={async (e) => {
            const val = e.target.checked;
            setPublishSold(val);
            await updateAgencySettings("demo-agency-id", { publish_sold: val });
          }}
          style={{ cursor: "pointer" }}
        />
        <label htmlFor="publishSoldCheckbox" style={{ cursor: "pointer", opacity: 0.8 }}>Publicar vehículos ya vendidos</label>
      </div>

      {/* Table grid */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: "60px" }}>Foto</th>
              <th>Vehículo</th>
              <th>Año</th>
              <th>Kilometraje</th>
              <th>Mecánica</th>
              <th>Precio</th>
              <th>Estado</th>
              <th style={{ width: "180px", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem", opacity: 0.6 }}>
                  No se encontraron vehículos en el stock.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className={styles.thumbnailCell}>
                      {v.images && v.images[0] ? (
                        <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className={styles.thumbnail} />
                      ) : (
                        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "var(--surface-color)", opacity: 0.5 }}>
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.titleCell}>{v.brand} {v.model}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.5 }}>Patente: {v.plate || "N/D"}</div>
                  </td>
                  <td>{v.year}</td>
                  <td>{v.kms.toLocaleString()} km</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {v.transmission === "automatica" ? "Automático" : "Manual"} / {v.fuel}
                  </td>
                  <td>
                    <span className={styles.priceCell}>
                      {v.currency} {v.price.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${v.status === 'disponible' ? styles.disponible : v.status === 'reservado' ? styles.reservada : styles.vendida}`}>
                      {v.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div className={styles.actionsWrapper} style={{ justifyContent: "center" }}>
                      <Link href={`/portal/demo/${v.id}`} target="_blank" className={styles.actionBtn} style={{ color: "#10b981" }}>
                        Ver
                      </Link>
                      <button className={styles.actionBtn} onClick={() => openEditModal(v)}>
                        Editar
                      </button>
                      <button className={styles.actionBtn} style={{ color: "var(--danger)" }} onClick={() => handleDelete(v.id)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.formModal}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>
                {editingVehicle ? "Editar Vehículo" : "Agregar Nuevo Vehículo"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-color)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Marca *</label>
                <input
                  type="text"
                  name="brand"
                  required
                  defaultValue={formState.brand}
                  className={styles.input}
                  placeholder="Ej: Chevrolet"
                />
                {errors.brand && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.brand[0]}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Modelo *</label>
                <input
                  type="text"
                  name="model"
                  required
                  defaultValue={formState.model}
                  className={styles.input}
                  placeholder="Ej: Cruze"
                />
                {errors.model && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.model[0]}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Año *</label>
                <input
                  type="number"
                  name="year"
                  required
                  defaultValue={formState.year}
                  className={styles.input}
                />
                {errors.year && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.year[0]}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Kilometraje *</label>
                <input
                  type="number"
                  name="kms"
                  required
                  defaultValue={formState.kms}
                  className={styles.input}
                />
                {errors.kms && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.kms[0]}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Transmisión *</label>
                <select name="transmission" defaultValue={formState.transmission} className={styles.select}>
                  <option value="manual">Manual</option>
                  <option value="automatica">Automática</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Combustible *</label>
                <select name="fuel" defaultValue={formState.fuel} className={styles.select}>
                  <option value="nafta">Nafta</option>
                  <option value="diesel">Diesel</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="electrico">Eléctrico</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Precio *</label>
                <input
                  type="number"
                  name="price"
                  required
                  defaultValue={formState.price}
                  className={styles.input}
                />
                {errors.price && <span style={{ color: "var(--danger)", fontSize: "0.75rem" }}>{errors.price[0]}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Moneda *</label>
                <select name="currency" defaultValue={formState.currency} className={styles.select}>
                  <option value="USD">USD (Dólares)</option>
                  <option value="UYU">UYU (Pesos Uruguayos)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  defaultValue={formState.color}
                  className={styles.input}
                  placeholder="Ej: Gris Plata"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Motor</label>
                <input
                  type="text"
                  name="engine"
                  defaultValue={formState.engine}
                  className={styles.input}
                  placeholder="Ej: 1.4 Turbo"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Puertas</label>
                <input
                  type="number"
                  name="doors"
                  defaultValue={formState.doors}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Patente/Matrícula</label>
                <input
                  type="text"
                  name="plate"
                  defaultValue={formState.plate}
                  className={styles.input}
                  placeholder="Ej: SBH 1234"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Estado *</label>
                <select name="status" defaultValue={formState.status} className={styles.select}>
                  <option value="disponible">Disponible</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>

              <div className={styles.formGroupFull} style={{ marginTop: "1rem" }}>
                <MediaUpload
                  items={mediaItems}
                  setItems={setMediaItems}
                  accept="image/*,video/*"
                  label="Fotos, Videos y YouTube"
                  placeholder="Arrastra imágenes o videos aquí, o haz clic para seleccionar"
                />
              </div>

              <div className={styles.formGroupFull}>
                <label>Descripción del Vehículo</label>
                <textarea
                  name="description"
                  defaultValue={formState.description}
                  className={styles.textarea}
                  placeholder="Detalles de equipamiento, estado, historial..."
                />
              </div>

              <div className={styles.formGroupFull + " " + styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)} disabled={isPending}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnSave} disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Vehículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
