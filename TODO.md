# Plan de Implementación - Certificados SSL

## Backend
- [x] 1. Crear entidad `CertificadoSsl` en `backend/src/entities/CertificadoSsl.ts`
- [x] 2. Modificar `Asset.ts` - agregar tipo "CERTIFICADO_SSL" y relación OneToOne
- [x] 3. Crear `certificadosSsl.controller.ts`
- [x] 4. Extender `assets.service.ts` con lógica para certificados SSL
- [x] 5. Crear `certificadosSsl.routes.ts` y registrar en `index.ts`
- [x] 6. Actualizar `validationRules.ts`

## Frontend
- [x] 7. Actualizar tipos (`index.tsx`) - agregar CERTIFICADO_SSL y CertificadoSsl interface
- [x] 8. Crear `FormCertificadoSsl` en `AssetCreateModal.forms.tsx`
- [x] 9. Actualizar `AssetCreateModal.tsx` - manejar nuevo tipo
- [x] 10. Actualizar `Dashboard/constants.ts` - labels, iconos, colores
- [x] 11. Agregar al menú de navegación en `Layout.tsx`
- [x] 12. Actualizar `AssetList.tsx` - tabla y filtros para SSL
- [x] 13. Actualizar `AssetDetail/TypeSections.tsx` - vista/edición SSL
- [x] 14. Actualizar `Dashboard/Dashboard.tsx` - stat card y gráficas

