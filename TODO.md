# TODO - Fix Marca/Modelo MOVIL no se guardan

- [ ] Revisar y corregir `SelectWithOtherField` para que al seleccionar “Otro” **no borre** el valor actual (cuando el valor viene de autollenado/staging y está fuera de la lista).
- [ ] Aplicar el fix en `Inventario/frontend/src/components/AssetCreateModal.fields.tsx`.
- [ ] Probar flujo MOVIL: elegir serial que setea marca/modelo fuera de lista → guardar → verificar persistencia.

