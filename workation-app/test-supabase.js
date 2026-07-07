const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://bwuxojmyxjqdzthvludo.supabase.co', 'sb_publishable_We0xpICRIvqkaJsriQiq3A_Kzppb8T0');

async function test() {
  const { data: a, error: e1 } = await supabase.from('accommodations').select('*');
  console.log('Accommodations error:', e1?.message);
  console.log('Accommodations count:', a?.length);
  
  const { data: s, error: e2 } = await supabase.from('subsidies').select('*');
  console.log('Subsidies error:', e2?.message);
  console.log('Subsidies count:', s?.length);
  
  if (a && a.length > 0) {
    console.log('Sample accommodation:', a[0].name, a[0].id, a[0].image_url);
  }
}
test();
