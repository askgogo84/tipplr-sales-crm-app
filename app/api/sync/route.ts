for (let index = 0; index < rows.length; index++) {
  const row = rows[index]
  const source_row_number = index + 2

  const restaurant_name = row[0]?.toString().trim() || null
  const owner_name = row[1]?.toString().trim() || null
  const contact_no = row[2]?.toString().trim() || null
  const status = row[3]?.toString().trim() || null
  const assigned_to_name = row[4]?.toString().trim() || null
  const remarks = row[5]?.toString().trim() || null

  if (!restaurant_name) continue

  const payload = {
    restaurant_name,
    owner_name,
    phone: contact_no,
    lead_status: status || 'Lead',
    assigned_to_name,
    remarks,
    source_row_number,
  }

  const { error } = await supabase
    .from('restaurants')
    .upsert(payload, {
      onConflict: 'source_row_number',
    })

  if (error) {
    console.error(`Row ${source_row_number} failed:`, error.message)
  }
}