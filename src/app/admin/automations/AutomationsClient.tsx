"use client";

import { useState, useTransition, useMemo } from "react";
import { 
  Zap, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  Mail, 
  Tag as TagIcon, 
  UserCheck,
  MessageSquare,
  Edit3,
  Search,
  CheckCircle2
} from "lucide-react";
import { 
  AutomationRule, 
  createAutomationRuleAction, 
  toggleAutomationRuleAction, 
  deleteAutomationRuleAction
} from "@/actions/automationActions";
import { 
  PRESET_AUTOMATIONS, 
  PRESET_CATEGORIES, 
  PresetAutomation 
} from "@/data/presetAutomations";
import styles from "./automations.module.css";

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AutomationsClientProps {
  initialRules: AutomationRule[];
  availableTags: string[];
  initialAgents: Agent[];
  currentUser: any;
}

export default function AutomationsClient({ 
  initialRules, 
  availableTags, 
  initialAgents,
  currentUser 
}: AutomationsClientProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "active">("catalog");
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);

  // Filtros del catálogo
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Modal para regla personalizada / edición
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [ruleTrigger, setRuleTrigger] = useState("lead_created");
  const [ruleTriggerVal, setRuleTriggerVal] = useState(availableTags[0] || "Lead Nuevo");
  const [ruleTagVal, setRuleTagVal] = useState(availableTags[0] || "Lead Nuevo");
  const [ruleActionType, setRuleActionType] = useState<"send_email" | "send_message" | "add_tag" | "notify_agent">("send_message");
  const [ruleActionVal, setRuleActionVal] = useState("Mensaje de bienvenida por WhatsApp");
  const [ruleActionDetails, setRuleActionDetails] = useState<{ body?: string; subject?: string; channel?: "WhatsApp" | "SMS"; tag?: string }>({
    channel: "WhatsApp",
    body: "¡Hola {{nombre}}! Gracias por contactar a nuestra automotora. ¿Buscás algún vehículo o modelo en particular? Dejanos tu consulta y un asesor te responderá a la brevedad."
  });

  const [isPending, startTransition] = useTransition();
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Helper para notificaciones temporales
  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  // Handler para activar/desactivar preset del catálogo
  const handleTogglePreset = (preset: PresetAutomation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const existing = rules.find(
      r => r.name.toLowerCase().trim() === preset.title.toLowerCase().trim() ||
           r.trigger_event === preset.trigger_event
    );

    startTransition(async () => {
      if (existing) {
        const newStatus = !existing.is_active;
        const res = await toggleAutomationRuleAction(existing.id, newStatus);
        if (res.success) {
          setRules(prev => prev.map(r => r.id === existing.id ? { ...r, is_active: newStatus } : r));
          showNotice(`Automatización ${newStatus ? "activada" : "desactivada"}`);
        } else {
          alert("Error al actualizar el estado de la automatización.");
        }
      } else {
        const defaultMsg = preset.defaultMessage || "¡Hola {{nombre}}! Gracias por contactar a nuestra automotora. ¿Buscás algún vehículo o modelo en particular? Dejanos tu consulta y un asesor te responderá a la brevedad.";
        const defaultTag = preset.defaultTag || availableTags[0] || "Lead Nuevo";

        const newRuleData: Partial<AutomationRule> = {
          agency_id: currentUser?.agency_id,
          name: preset.title,
          trigger_event: preset.trigger_event,
          trigger_value: defaultTag,
          action_type: preset.default_action_type,
          action_value: preset.default_action_label,
          actions: [
            {
              id: "act-1",
              type: preset.default_action_type,
              value: preset.default_action_label,
              details: {
                channel: "WhatsApp",
                body: defaultMsg,
                tag: defaultTag
              }
            }
          ],
          is_active: true
        };

        const res = await createAutomationRuleAction(newRuleData as any);
        if (res.success && (res.data || (res as any).rule)) {
          const created = res.data || (res as any).rule;
          setRules(prev => [created, ...prev]);
          showNotice(`"${preset.title}" activada correctamente`);
        } else {
          alert("Error al crear la automatización.");
        }
      }
    });
  };

  // Handler para alternar estado de una regla en "Activas"
  const handleToggleRule = (rule: AutomationRule, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    startTransition(async () => {
      const newStatus = !rule.is_active;
      const res = await toggleAutomationRuleAction(rule.id, newStatus);
      if (res.success) {
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: newStatus } : r));
        showNotice(`Automatización ${newStatus ? "activada" : "desactivada"}`);
      } else {
        alert("Error al actualizar regla.");
      }
    });
  };

  // Handler para eliminar una regla
  const handleDeleteRule = (ruleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("¿Estás seguro de eliminar esta automatización?")) return;
    startTransition(async () => {
      const res = await deleteAutomationRuleAction(ruleId);
      if (res.success) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
        showNotice("Automatización eliminada");
      } else {
        alert("Error al eliminar automatización.");
      }
    });
  };

  // Abrir modal de creación/edición de regla existente
  const handleOpenRuleModal = (rule?: AutomationRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleName(rule.name);
      setRuleTrigger(rule.trigger_event);
      setRuleTriggerVal(rule.trigger_value || availableTags[0] || "");

      const firstAction = rule.actions && rule.actions[0];
      setRuleActionType((rule.action_type as any) || "send_message");
      setRuleActionVal(rule.action_value || "Mensaje de WhatsApp");
      setRuleTagVal(firstAction?.details?.tag || rule.trigger_value || availableTags[0] || "Lead Nuevo");
      setRuleActionDetails({
        channel: "WhatsApp",
        body: firstAction?.details?.body || "¡Hola {{nombre}}! Gracias por contactar a nuestra automotora. ¿Buscás algún vehículo en particular?",
        tag: firstAction?.details?.tag || rule.trigger_value || "Lead Nuevo"
      });
    } else {
      setEditingRule(null);
      setRuleName("");
      setRuleTrigger("lead_created");
      setRuleTriggerVal(availableTags[0] || "Lead Nuevo");
      setRuleTagVal(availableTags[0] || "Lead Nuevo");
      setRuleActionType("send_message");
      setRuleActionVal("WhatsApp de Bienvenida");
      setRuleActionDetails({
        channel: "WhatsApp",
        body: "¡Hola {{nombre}}! Gracias por contactar a nuestra automotora. ¿Buscás algún vehículo o modelo en particular? Dejanos tu consulta y un asesor te responderá a la brevedad.",
        tag: availableTags[0] || "Lead Nuevo"
      });
    }
    setShowRuleModal(true);
  };

  // Abrir modal para configurar/editar un Preset del catálogo al hacer clic sobre la fila
  const handleOpenPresetModal = (preset: PresetAutomation) => {
    const existing = rules.find(
      r => r.name.toLowerCase().trim() === preset.title.toLowerCase().trim() ||
           r.trigger_event === preset.trigger_event
    );

    if (existing) {
      handleOpenRuleModal(existing);
    } else {
      setEditingRule(null);
      setRuleName(preset.title);
      setRuleTrigger(preset.trigger_event);
      setRuleTriggerVal(preset.defaultTag || availableTags[0] || "Lead Nuevo");
      setRuleTagVal(preset.defaultTag || availableTags[0] || "Lead Nuevo");
      setRuleActionType(preset.default_action_type);
      setRuleActionVal(preset.default_action_label);
      setRuleActionDetails({
        channel: "WhatsApp",
        body: preset.defaultMessage || "¡Hola {{nombre}}! Gracias por contactar a nuestra automotora. ¿Buscás algún vehículo o modelo en particular? Dejanos tu consulta y un asesor te responderá a la brevedad.",
        tag: preset.defaultTag || "Lead Nuevo"
      });
      setShowRuleModal(true);
    }
  };

  // Guardar regla personalizada o edición de preset
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      alert("Por favor ingresa un nombre para la automatización.");
      return;
    }

    startTransition(async () => {
      const updatedDetails = {
        ...ruleActionDetails,
        tag: ruleTagVal
      };

      if (editingRule) {
        setRules(prev => prev.map(r => r.id === editingRule.id ? {
          ...r,
          name: ruleName,
          trigger_event: ruleTrigger,
          trigger_value: ruleTagVal,
          action_type: ruleActionType,
          action_value: ruleActionVal,
          actions: [
            {
              id: "act-edit",
              type: ruleActionType,
              value: ruleActionVal,
              details: updatedDetails
            }
          ]
        } : r));
        showNotice("Automatización actualizada");
      } else {
        const newRuleData: Partial<AutomationRule> = {
          agency_id: currentUser?.agency_id,
          name: ruleName,
          trigger_event: ruleTrigger,
          trigger_value: ruleTagVal,
          action_type: ruleActionType,
          action_value: ruleActionVal,
          actions: [
            {
              id: "act-" + Date.now(),
              type: ruleActionType,
              value: ruleActionVal,
              details: updatedDetails
            }
          ],
          is_active: true
        };

        const res = await createAutomationRuleAction(newRuleData as any);
        if (res.success && (res.data || (res as any).rule)) {
          const created = res.data || (res as any).rule;
          setRules(prev => [created, ...prev]);
          showNotice("Nueva automatización guardada y activada");
        } else {
          alert("Error al guardar la regla.");
        }
      }
      setShowRuleModal(false);
    });
  };

  // Filtrado de presets
  const filteredPresets = useMemo(() => {
    return PRESET_AUTOMATIONS.filter(p => {
      const matchCat = selectedCategory === "Todas" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Reglas activas filtradas
  const activeRulesList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rules;
    return rules.filter(r => r.name.toLowerCase().includes(q) || (r.trigger_event && r.trigger_event.toLowerCase().includes(q)));
  }, [rules, searchQuery]);

  // Color de fondo para íconos
  const getIconBgColor = (iconType: string) => {
    switch (iconType) {
      case "clock": return "#2563eb"; // Azul
      case "message": return "#10b981"; // Verde Emerald
      case "tag": return "#b45309"; // Ámbar/Marrón
      case "user": return "#7c3aed"; // Violeta
      case "zap": return "#f97316"; // Naranja
      case "mail":
      default: return "#06b6d4"; // Cian
    }
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case "clock": return <Clock style={{ width: "24px", height: "24px" }} />;
      case "message": return <MessageSquare style={{ width: "24px", height: "24px" }} />;
      case "tag": return <TagIcon style={{ width: "24px", height: "24px" }} />;
      case "user": return <UserCheck style={{ width: "24px", height: "24px" }} />;
      case "zap": return <Zap style={{ width: "24px", height: "24px" }} />;
      case "mail":
      default: return <Mail style={{ width: "24px", height: "24px" }} />;
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Notification Toast */}
      {statusNotice && (
        <div className={styles.toast}>
          <CheckCircle2 style={{ width: "20px", height: "20px", color: "#10b981" }} />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Main Solid Container */}
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Automatizaciones</h1>
            <p className={styles.subtitle}>
              Activa mensajes de bienvenida y reglas de etiquetado para responder al instante a tus prospectos.
            </p>
          </div>
          <button
            className={styles.createBtn}
            onClick={() => handleOpenRuleModal()}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            <span>Crear Automatización</span>
          </button>
        </div>

        {/* Subtabs & Search */}
        <div className={styles.subtabsNav}>
          <div className={styles.tabsGroup}>
            <button
              className={`${styles.tabBtn} ${activeTab === "catalog" ? styles.activeTabBtn : ""}`}
              onClick={() => setActiveTab("catalog")}
            >
              Catálogo ({PRESET_AUTOMATIONS.length})
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "active" ? styles.activeTabBtn : ""}`}
              onClick={() => setActiveTab("active")}
            >
              <span>Activas</span>
              <span className={`${styles.counterBadge} ${rules.filter(r => r.is_active).length > 0 ? styles.counterBadgeActive : ""}`}>
                {rules.filter(r => r.is_active).length}
              </span>
            </button>
          </div>

          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar automatización..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Category Pills (Only on Catalog) */}
        {activeTab === "catalog" && (
          <div className={styles.categoryGroup}>
            {PRESET_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryPill} ${selectedCategory === cat ? styles.activeCategoryPill : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* CATALOG LIST VIEW */}
        {activeTab === "catalog" && (
          <div className={styles.list}>
            {filteredPresets.length === 0 ? (
              <div style={{ padding: "4rem 0", textAlign: "center", color: "#9ca3af" }}>
                <Search style={{ width: "32px", height: "32px", margin: "0 auto 0.5rem", opacity: 0.5 }} />
                <p style={{ fontSize: "0.875rem" }}>No se encontraron automatizaciones para tu búsqueda.</p>
              </div>
            ) : (
              filteredPresets.map((preset) => {
                const matchedRule = rules.find(
                  r => r.name.toLowerCase().trim() === preset.title.toLowerCase().trim() ||
                       r.trigger_event === preset.trigger_event
                );
                const isOn = matchedRule ? matchedRule.is_active : false;

                return (
                  <div 
                    key={preset.id} 
                    className={styles.listItem}
                    onClick={() => handleOpenPresetModal(preset)}
                    title="Haz clic para configurar o editar esta regla"
                  >
                    <div className={styles.itemLeft}>
                      <div
                        className={styles.iconSquare}
                        style={{ backgroundColor: getIconBgColor(preset.iconType) }}
                      >
                        {renderIcon(preset.iconType)}
                      </div>

                      <div className={styles.itemContent}>
                        <div className={styles.itemTitleRow}>
                          <h3 className={styles.itemTitle}>{preset.title}</h3>
                          {isOn ? (
                            <span className={styles.statusOn}>(On)</span>
                          ) : (
                            <span className={styles.statusOff}>(Off)</span>
                          )}
                        </div>
                        <p className={styles.itemDesc}>{preset.description}</p>
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePreset(preset, e)}
                        disabled={isPending}
                        className={`${styles.switchToggle} ${isOn ? styles.switchToggleOn : ""}`}
                        role="switch"
                        aria-checked={isOn}
                        title={isOn ? "Desactivar automatización" : "Activar automatización"}
                      >
                        <span className={`${styles.switchThumb} ${isOn ? styles.switchThumbOn : ""}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ACTIVE RULES LIST VIEW */}
        {activeTab === "active" && (
          <div className={styles.list}>
            {activeRulesList.length === 0 ? (
              <div style={{ padding: "4rem 0", textAlign: "center" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "var(--surface-hover, #f3f4f6)",
                  color: "var(--text-color, #9ca3af)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 0.75rem"
                }}>
                  <Zap style={{ width: "24px", height: "24px" }} />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-color, #111827)", marginBottom: "0.25rem" }}>
                  No tienes automatizaciones configuradas
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-color, #6b7280)", opacity: 0.8, marginBottom: "1.25rem" }}>
                  Explora el catálogo para activar mensajes de bienvenida y reglas de etiquetas.
                </p>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className={styles.createBtn}
                >
                  <span>Ver Catálogo</span>
                </button>
              </div>
            ) : (
              activeRulesList.map((rule) => {
                const isOn = rule.is_active;

                return (
                  <div 
                    key={rule.id} 
                    className={styles.listItem}
                    onClick={() => handleOpenRuleModal(rule)}
                    title="Haz clic para editar esta regla"
                  >
                    <div className={styles.itemLeft}>
                      <div
                        className={styles.iconSquare}
                        style={{ backgroundColor: isOn ? "#10b981" : "#9ca3af" }}
                      >
                        <Zap style={{ width: "24px", height: "24px" }} />
                      </div>

                      <div className={styles.itemContent}>
                        <div className={styles.itemTitleRow}>
                          <h3 className={styles.itemTitle}>{rule.name}</h3>
                          {isOn ? (
                            <span className={styles.statusOn}>(On)</span>
                          ) : (
                            <span className={styles.statusOff}>(Off)</span>
                          )}
                        </div>
                        <p className={styles.itemDesc}>
                          Disparador: <strong>{rule.trigger_event}</strong>
                          {rule.trigger_value && ` (${rule.trigger_value})`} • Acción: <strong>{rule.action_value || rule.action_type}</strong>
                        </p>
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleRule(rule, e)}
                        disabled={isPending}
                        className={`${styles.switchToggle} ${isOn ? styles.switchToggleOn : ""}`}
                        role="switch"
                        aria-checked={isOn}
                        title={isOn ? "Desactivar automatización" : "Activar automatización"}
                      >
                        <span className={`${styles.switchThumb} ${isOn ? styles.switchThumbOn : ""}`} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenRuleModal(rule); }}
                        className={styles.actionBtn}
                        title="Editar"
                      >
                        <Edit3 style={{ width: "16px", height: "16px" }} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteRule(rule.id, e)}
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        title="Eliminar"
                      >
                        <Trash2 style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREAR / EDITAR REGLA */}
      {showRuleModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRuleModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingRule ? "Editar Automatización" : "Configurar Automatización"}
              </h2>
              <button
                onClick={() => setShowRuleModal(false)}
                className={styles.closeBtn}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <form onSubmit={handleSaveRule}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Nombre de la Automatización
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Saludo automático por WhatsApp"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Evento Disparador (Trigger)
                </label>
                <select
                  value={ruleTrigger}
                  onChange={(e) => setRuleTrigger(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="lead_created">Nuevo Lead Registrado</option>
                  <option value="after_hours_message">Consulta Fuera de Horario Comercial</option>
                  <option value="tag_added">Cuando se agrega una Etiqueta</option>
                  <option value="lead_budget_high">Presupuesto Alto / VIP</option>
                  <option value="meta_ads_lead">Ingreso por Meta Ads</option>
                  <option value="brand_inquiry">Consulta por Marca Específica</option>
                  <option value="lead_disqualified">Lead Descalificado</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Etiqueta a Asignar / Vincular
                </label>
                <select
                  value={ruleTagVal}
                  onChange={(e) => setRuleTagVal(e.target.value)}
                  className={styles.formSelect}
                >
                  {availableTags.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>
                  Acción Principal
                </label>
                <select
                  value={ruleActionType}
                  onChange={(e) => setRuleActionType(e.target.value as any)}
                  className={styles.formSelect}
                >
                  <option value="send_message">Enviar Mensaje de Bienvenida (WhatsApp)</option>
                  <option value="send_email">Enviar Email de Bienvenida</option>
                  <option value="add_tag">Solo Asignar Etiqueta</option>
                  <option value="notify_agent">Notificar al Vendedor</option>
                </select>
              </div>

              {(ruleActionType === "send_message" || ruleActionType === "send_email") && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Mensaje de Bienvenida
                  </label>
                  <textarea
                    rows={4}
                    value={ruleActionDetails.body || ""}
                    onChange={(e) => setRuleActionDetails(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Escribe el mensaje de saludo para tus clientes..."
                    className={styles.formTextarea}
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-color, #6b7280)", opacity: 0.7, marginTop: "0.35rem" }}>
                    Puedes usar variables como <code style={{ backgroundColor: "var(--surface-hover, #f3f4f6)", padding: "2px 4px", borderRadius: "4px" }}>{"{{nombre}}"}</code> para personalizar la respuesta.
                  </p>
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={styles.createBtn}
                >
                  {editingRule ? "Guardar Cambios" : "Guardar y Activar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
