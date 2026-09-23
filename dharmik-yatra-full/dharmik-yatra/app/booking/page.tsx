'use client'
import {useState} from 'react'
import Link from 'next/link'
import {trips,waLink} from '@/lib/data'
import {getSupabaseBrowser} from '@/lib/supabase-browser'

export default function Booking(){
 const [data,setData]=useState({name:'',phone:'',trip:trips[0].slug,people:'1',pickup:'',notes:''})
 const [message,setMessage]=useState('')
 const [loading,setLoading]=useState(false)
 const t=trips.find(x=>x.slug===data.trip)!
 async function submit(e:React.FormEvent){
  e.preventDefault(); setLoading(true); setMessage('')
  const code=`DY-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.floor(1000+Math.random()*9000)}`
  const supabase=getSupabaseBrowser()
  if(supabase){
   const {data:dbTrip}=await supabase.from('trips').select('id').eq('slug',t.slug).maybeSingle()
   const {error}=await supabase.from('bookings').insert({booking_code:code,trip_id:dbTrip?.id??null,customer_name:data.name,phone:data.phone,passengers:Number(data.people),pickup_point:data.pickup,amount:t.price*Number(data.people),notes:data.notes})
   if(error) console.warn('Booking database insert failed:',error.message)
  }
  const msg=`Namaste, I want to book a yatra.\nBooking ID: ${code}\nName: ${data.name}\nPhone: ${data.phone}\nYatra: ${t.title}\nDate: ${t.date}\nPassengers: ${data.people}\nPickup: ${data.pickup}\nNotes: ${data.notes}`
  setMessage(`Booking request ${code} तैयार है. WhatsApp खुल रहा है...`)
  window.location.href=waLink(msg)
  setLoading(false)
 }
 return <main><div className="container pagePad"><Link href="/">← Home</Link><div className="eyebrow topGap">Seat enquiry</div><h1 className="pageTitle">अपनी यात्रा बुक करें</h1><p className="lead">Details submit करें; booking confirmation और payment operator WhatsApp पर confirm करेगा.</p><div className="form"><form onSubmit={submit}><div className="formGrid"><div className="field"><label>नाम *</label><input required value={data.name} onChange={e=>setData({...data,name:e.target.value})}/></div><div className="field"><label>Mobile *</label><input required inputMode="numeric" pattern="[0-9]{10}" value={data.phone} onChange={e=>setData({...data,phone:e.target.value.replace(/\D/g,'').slice(0,10)})}/></div><div className="field full"><label>Yatra *</label><select value={data.trip} onChange={e=>setData({...data,trip:e.target.value})}>{trips.map(x=><option key={x.slug} value={x.slug}>{x.title} — {x.date}</option>)}</select></div><div className="field"><label>Passengers *</label><input required type="number" min="1" max="20" value={data.people} onChange={e=>setData({...data,people:e.target.value})}/></div><div className="field"><label>Pickup point *</label><input required placeholder="e.g. Shahdara" value={data.pickup} onChange={e=>setData({...data,pickup:e.target.value})}/></div><div className="field full"><label>Notes</label><textarea value={data.notes} onChange={e=>setData({...data,notes:e.target.value})}/></div></div><div className="priceBox">Estimated package amount: <strong>₹{(t.price*Number(data.people)).toLocaleString('en-IN')}</strong></div>{message&&<div className="success">{message}</div>}<button disabled={loading} className="btn primary fullBtn">{loading?'Preparing booking…':'WhatsApp पर Booking Request भेजें'}</button></form></div></div></main>
}
