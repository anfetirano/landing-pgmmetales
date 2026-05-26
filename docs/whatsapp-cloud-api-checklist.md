# WhatsApp Cloud API Checklist

Pendiente de Meta:
- aprobacion de verificacion del negocio en Business Suite
- conexion del numero real que va a enviar las campanas
- aprobacion de plantillas

Datos que luego hay que cargar en produccion:
- `WHATSAPP_CLOUD_ACCESS_TOKEN`
- `WHATSAPP_CLOUD_PHONE_NUMBER_ID`
- `WHATSAPP_CLOUD_API_VERSION`
- `WHATSAPP_TEMPLATE_LANGUAGE_CODE`
- `WHATSAPP_TEMPLATE_PANAMA`
- `WHATSAPP_TEMPLATE_COLON`
- `WHATSAPP_TEMPLATE_CHORRERA`
- `WHATSAPP_TEMPLATE_DAVID`
- `WHATSAPP_TEMPLATE_INTERIOR`
- `WHATSAPP_TEMPLATE_ALL`

Plantillas minimas recomendadas:
- una plantilla de ruta por zona
- una plantilla general para `Todos Panama`
- una plantilla de disponibilidad si quieren una segunda variante

Prueba inicial recomendada:
1. conectar el numero
2. cargar token y `phone_number_id`
3. aprobar al menos una plantilla
4. probar con `David` o `Interior`
5. revisar enviados y fallidos
6. luego probar `Panama Metro` o `Todos Panama`
