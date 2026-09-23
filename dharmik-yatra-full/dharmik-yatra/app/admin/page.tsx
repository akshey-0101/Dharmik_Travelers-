'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

type Booking = {
  id: string
  booking_code: string
  customer_name: string
  phone: string
  passengers: number
  pickup_point: string
  amount: number
  advance_paid: number
  payment_status: string
  booking_status: string
  created_at: string
  trips?: { title: string } | null
}

type Trip = {
  id: string
  slug: string
  title: string
  travel_date: string | null
  price: number
  capacity: number
  pickup_points: string[] | null
  places: string[] | null
  included: string[] | null
  not_included: string[] | null
  status: string
  created_at: string
}

type TripForm = {
  slug: string
  title: string
  travel_date: string
  price: string
  capacity: string
  pickup_points: string
  places: string
  included: string
  not_included: string
  status: 'draft' | 'published'
}

const emptyTrip: TripForm = {
  slug: '',
  title: '',
  travel_date: '',
  price: '',
  capacity: '40',
  pickup_points: '',
  places: '',
  included: '',
  not_included: '',
  status: 'published',
}

export default function Admin() {
  const sb = getSupabaseBrowser()

  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [trips, setTrips] = useState<Trip[]>([])

  const [activeTab, setActiveTab] =
    useState<'bookings' | 'trips'>('bookings')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loading, setLoading] = useState(false)
  const [tripLoading, setTripLoading] = useState(false)

  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTripId, setEditingTripId] = useState<string | null>(null)

  const [tripForm, setTripForm] = useState<TripForm>(emptyTrip)

  /* =========================================================
     LOAD ADMIN DATA
     ========================================================= */

  async function load() {
    if (!sb) return

    setError('')

    const {
      data: { user },
    } = await sb.auth.getUser()

    setUser(user)

    if (!user) return

    const bookingResult = await sb
      .from('bookings')
      .select('*,trips(title)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (bookingResult.error) {
      setError(bookingResult.error.message)
    } else {
      setBookings((bookingResult.data || []) as Booking[])
    }

    const tripResult = await sb
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })

    if (tripResult.error) {
      setError(tripResult.error.message)
    } else {
      setTrips((tripResult.data || []) as Trip[])
    }
  }

  useEffect(() => {
    load()
  }, [])

  /* =========================================================
     LOGIN
     ========================================================= */

  async function login(e: React.FormEvent) {
    e.preventDefault()

    if (!sb) return

    setError('')
    setLoading(true)

    const result = await sb.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    await load()
  }

  /* =========================================================
     LOGOUT
     ========================================================= */

  async function logout() {
    await sb?.auth.signOut()

    setUser(null)
    setBookings([])
    setTrips([])
  }

  /* =========================================================
     SLUG GENERATOR
     ========================================================= */

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  /* =========================================================
     JSON ARRAY HELPERS
     ========================================================= */

  function arrayToText(value: string[] | null | undefined) {
    if (!value || !Array.isArray(value)) return ''

    return value.join('\n')
  }

  function textToArray(value: string) {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  /* =========================================================
     UPDATE FORM
     ========================================================= */

  function updateTripField(
    field: keyof TripForm,
    value: string
  ) {
    setTripForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  /* =========================================================
     ADD TRIP
     ========================================================= */

  function startAddTrip() {
    setEditingTripId(null)
    setTripForm(emptyTrip)
    setError('')
    setSuccess('')
    setShowTripForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /* =========================================================
     EDIT TRIP
     ========================================================= */

  function startEditTrip(trip: Trip) {
    setEditingTripId(trip.id)

    setTripForm({
      slug: trip.slug || '',
      title: trip.title || '',
      travel_date: trip.travel_date || '',
      price: String(trip.price ?? 0),
      capacity: String(trip.capacity ?? 40),
      pickup_points: arrayToText(trip.pickup_points),
      places: arrayToText(trip.places),
      included: arrayToText(trip.included),
      not_included: arrayToText(trip.not_included),
      status:
        trip.status === 'published'
          ? 'published'
          : 'draft',
    })

    setError('')
    setSuccess('')
    setShowTripForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /* =========================================================
     CANCEL EDIT
     ========================================================= */

  function cancelTripForm() {
    setShowTripForm(false)
    setEditingTripId(null)
    setTripForm(emptyTrip)
    setError('')
  }

  /* =========================================================
     SAVE TRIP
     ========================================================= */

  async function saveTrip(e: React.FormEvent) {
    e.preventDefault()

    if (!sb) return

    setError('')
    setSuccess('')
    setTripLoading(true)

    if (!tripForm.title.trim()) {
      setError('Trip title is required.')
      setTripLoading(false)
      return
    }

    if (!tripForm.slug.trim()) {
      setError('Trip slug is required.')
      setTripLoading(false)
      return
    }

    const price = Number(tripForm.price)

    if (Number.isNaN(price) || price < 0) {
      setError('Please enter a valid price.')
      setTripLoading(false)
      return
    }

    const capacity = Number(tripForm.capacity)

    if (
      Number.isNaN(capacity) ||
      capacity < 1
    ) {
      setError('Capacity must be at least 1.')
      setTripLoading(false)
      return
    }

    const payload = {
      slug: tripForm.slug.trim(),
      title: tripForm.title.trim(),
      travel_date:
        tripForm.travel_date.trim() || null,
      price,
      capacity,
      pickup_points: textToArray(
        tripForm.pickup_points
      ),
      places: textToArray(
        tripForm.places
      ),
      included: textToArray(
        tripForm.included
      ),
      not_included: textToArray(
        tripForm.not_included
      ),
      status: tripForm.status,
    }

    let result

    if (editingTripId) {
      result = await sb
        .from('trips')
        .update(payload)
        .eq('id', editingTripId)
    } else {
      result = await sb
        .from('trips')
        .insert(payload)
    }

    setTripLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setSuccess(
      editingTripId
        ? 'Trip updated successfully.'
        : 'Trip created successfully.'
    )

    setShowTripForm(false)
    setEditingTripId(null)
    setTripForm(emptyTrip)

    await load()
  }

  /* =========================================================
     DELETE TRIP
     ========================================================= */

  async function deleteTrip(trip: Trip) {
    if (!sb) return

    const confirmed = window.confirm(
      `Delete "${trip.title}"?\n\nThis cannot be undone.`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    const result = await sb
      .from('trips')
      .delete()
      .eq('id', trip.id)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setSuccess('Trip deleted successfully.')

    await load()
  }

  /* =========================================================
     PUBLISH / UNPUBLISH
     ========================================================= */

  async function toggleTripStatus(trip: Trip) {
    if (!sb) return

    const newStatus =
      trip.status === 'published'
        ? 'draft'
        : 'published'

    setError('')
    setSuccess('')

    const result = await sb
      .from('trips')
      .update({
        status: newStatus,
      })
      .eq('id', trip.id)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setSuccess(
      newStatus === 'published'
        ? 'Trip published.'
        : 'Trip moved to draft.'
    )

    await load()
  }

  /* =========================================================
     SUPABASE CHECK
     ========================================================= */

  if (!sb) {
    return (
      <main>
        <div className="container pagePad">
          <h1 className="pageTitle">
            Admin setup required
          </h1>

          <p className="lead">
            Add Supabase environment variables first.
          </p>
        </div>
      </main>
    )
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  if (!user) {
    return (
      <main>
        <div className="container pagePad">
          <Link href="/">← Home</Link>

          <div className="form narrow">
            <div className="eyebrow">
              Private dashboard
            </div>

            <h1 className="pageTitle small">
              Admin Login
            </h1>

            <form onSubmit={login}>
              <div className="field">
                <label>Email</label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div className="field">
                <label>Password</label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              <button
                className="btn primary fullBtn"
                disabled={loading}
              >
                {loading
                  ? 'Signing in...'
                  : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  /* =========================================================
     ADMIN DASHBOARD
     ========================================================= */

  return (
    <main>
      <div className="container pagePad">

        {/* HEADER */}

        <div className="adminTop">
          <div>
            <div className="eyebrow">
              Dharmik Yatra
            </div>

            <h1 className="pageTitle small">
              Admin Dashboard
            </h1>
          </div>

          <button
            className="btn secondary"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {/* TABS */}

        <div className="adminTabs">
          <button
            className={
              activeTab === 'bookings'
                ? 'btn primary'
                : 'btn secondary'
            }
            onClick={() => {
              setActiveTab('bookings')
              setError('')
              setSuccess('')
            }}
          >
            Bookings
          </button>

          <button
            className={
              activeTab === 'trips'
                ? 'btn primary'
                : 'btn secondary'
            }
            onClick={() => {
              setActiveTab('trips')
              setError('')
              setSuccess('')
            }}
          >
            Trips
          </button>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {success && (
          <div className="success">
            {success}
          </div>
        )}

        {/* =====================================================
            BOOKINGS
           ===================================================== */}

        {activeTab === 'bookings' && (
          <>
            <div className="stats">

              <div>
                <span>Bookings</span>

                <strong>
                  {bookings.length}
                </strong>
              </div>

              <div>
                <span>Passengers</span>

                <strong>
                  {bookings.reduce(
                    (total, booking) =>
                      total + booking.passengers,
                    0
                  )}
                </strong>
              </div>

              <div>
                <span>Booking value</span>

                <strong>
                  ₹
                  {bookings
                    .reduce(
                      (total, booking) =>
                        total +
                        (booking.amount || 0),
                      0
                    )
                    .toLocaleString('en-IN')}
                </strong>
              </div>

            </div>

            <div className="tableWrap">
              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Trip</th>
                    <th>People</th>
                    <th>Pickup</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {bookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: 'center',
                          padding: '35px',
                        }}
                      >
                        No bookings yet.
                      </td>
                    </tr>
                  )}

                  {bookings.map((booking) => (
                    <tr key={booking.id}>

                      <td>
                        <strong>
                          {booking.booking_code}
                        </strong>

                        <br />

                        <small>
                          {new Date(
                            booking.created_at
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </small>
                      </td>

                      <td>
                        {booking.customer_name}
                        <br />
                        {booking.phone}
                      </td>

                      <td>
                        {booking.trips?.title ||
                          '—'}
                      </td>

                      <td>
                        {booking.passengers}
                      </td>

                      <td>
                        {booking.pickup_point}
                      </td>

                      <td>
                        ₹
                        {(
                          booking.amount || 0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      <td>
                        <span className="pill">
                          {booking.booking_status}
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </>
        )}

        {/* =====================================================
            TRIPS
           ===================================================== */}

        {activeTab === 'trips' && (
          <>

            <div className="adminSectionHeader">

              <div>
                <h2>Trips</h2>

                <p>
                  Add and manage all Dharmik Yatra
                  trips from here.
                </p>
              </div>

              <button
                className="btn primary"
                onClick={startAddTrip}
              >
                + Add Trip
              </button>

            </div>

            {/* TRIP EDITOR */}

            {showTripForm && (
              <div className="adminEditor">

                <div className="adminEditorHeader">

                  <div>
                    <div className="eyebrow">
                      {editingTripId
                        ? 'Edit Trip'
                        : 'New Trip'}
                    </div>

                    <h2>
                      {editingTripId
                        ? 'Update Yatra'
                        : 'Create Yatra'}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={cancelTripForm}
                  >
                    Cancel
                  </button>

                </div>

                <form
                  className="form"
                  onSubmit={saveTrip}
                >

                  <div className="formGrid">

                    {/* TITLE */}

                    <div className="field full">
                      <label>
                        Trip Title *
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="Golu Devta • Kainchi Dham • Mukteshwar"
                        value={tripForm.title}
                        onChange={(e) => {
                          const title =
                            e.target.value

                          setTripForm(
                            (previous) => ({
                              ...previous,
                              title,
                              slug:
                                editingTripId
                                  ? previous.slug
                                  : makeSlug(title),
                            })
                          )
                        }}
                      />
                    </div>

                    {/* SLUG */}

                    <div className="field">
                      <label>
                        Slug *
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="golu-kainchi-mukteshwar"
                        value={tripForm.slug}
                        onChange={(e) =>
                          updateTripField(
                            'slug',
                            e.target.value
                          )
                        }
                      />

                      <small>
                        Used in the trip URL.
                      </small>
                    </div>

                    {/* DATE */}

                    <div className="field">
                      <label>
                        Travel Date
                      </label>

                      <input
                        type="date"
                        value={
                          tripForm.travel_date
                        }
                        onChange={(e) =>
                          updateTripField(
                            'travel_date',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    {/* PRICE */}

                    <div className="field">
                      <label>
                        Price per person *
                      </label>

                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="1850"
                        value={tripForm.price}
                        onChange={(e) =>
                          updateTripField(
                            'price',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    {/* CAPACITY */}

                    <div className="field">
                      <label>
                        Bus / Trip Capacity *
                      </label>

                      <input
                        type="number"
                        min="1"
                        required
                        value={
                          tripForm.capacity
                        }
                        onChange={(e) =>
                          updateTripField(
                            'capacity',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    {/* PICKUP POINTS */}

                    <div className="field full">
                      <label>
                        Pickup Points
                      </label>

                      <textarea
                        placeholder={
                          'One pickup point per line\nShahdara, Delhi\nAnand Vihar\nKarkardooma'
                        }
                        value={
                          tripForm.pickup_points
                        }
                        onChange={(e) =>
                          updateTripField(
                            'pickup_points',
                            e.target.value
                          )
                        }
                      />

                      <small>
                        Enter one pickup point
                        per line.
                      </small>
                    </div>

                    {/* PLACES */}

                    <div className="field full">
                      <label>
                        Places / Temples Covered
                      </label>

                      <textarea
                        placeholder={
                          'One place per line\nGolu Devta\nKainchi Dham\nMukteshwar'
                        }
                        value={
                          tripForm.places
                        }
                        onChange={(e) =>
                          updateTripField(
                            'places',
                            e.target.value
                          )
                        }
                      />

                      <small>
                        Enter one destination per
                        line.
                      </small>
                    </div>

                    {/* INCLUDED */}

                    <div className="field">
                      <label>
                        Included
                      </label>

                      <textarea
                        placeholder={
                          'Round-trip bus\nTea / breakfast\nTour coordinator'
                        }
                        value={
                          tripForm.included
                        }
                        onChange={(e) =>
                          updateTripField(
                            'included',
                            e.target.value
                          )
                        }
                      />

                      <small>
                        One item per line.
                      </small>
                    </div>

                    {/* NOT INCLUDED */}

                    <div className="field">
                      <label>
                        Not Included
                      </label>

                      <textarea
                        placeholder={
                          'Personal expenses\nSpecial darshan charges'
                        }
                        value={
                          tripForm.not_included
                        }
                        onChange={(e) =>
                          updateTripField(
                            'not_included',
                            e.target.value
                          )
                        }
                      />

                      <small>
                        One item per line.
                      </small>
                    </div>

                    {/* STATUS */}

                    <div className="field full">
                      <label>
                        Trip Status
                      </label>

                      <select
                        value={
                          tripForm.status
                        }
                        onChange={(e) =>
                          updateTripField(
                            'status',
                            e.target.value
                          )
                        }
                      >
                        <option value="published">
                          Published — visible on website
                        </option>

                        <option value="draft">
                          Draft — hidden from website
                        </option>
                      </select>
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="btn primary"
                    disabled={tripLoading}
                  >
                    {tripLoading
                      ? 'Saving...'
                      : editingTripId
                        ? 'Save Changes'
                        : 'Create Trip'}
                  </button>

                </form>
              </div>
            )}

            {/* TRIPS TABLE */}

            <div className="tableWrap">

              <table className="adminTable">

                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Capacity</th>
                    <th>Places</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {trips.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: 'center',
                          padding: '40px',
                        }}
                      >
                        No trips found.
                      </td>
                    </tr>
                  )}

                  {trips.map((trip) => (
                    <tr key={trip.id}>

                      <td>
                        <strong>
                          {trip.title}
                        </strong>

                        <br />

                        <small>
                          /{trip.slug}
                        </small>
                      </td>

                      <td>
                        {trip.travel_date
                          ? new Date(
                              trip.travel_date +
                                'T00:00:00'
                            ).toLocaleDateString(
                              'en-IN',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : '—'}
                      </td>

                      <td>
                        ₹
                        {Number(
                          trip.price || 0
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      <td>
                        {trip.capacity}
                      </td>

                      <td>
                        {trip.places?.length || 0}
                      </td>

                      <td>
                        <span
                          className={
                            trip.status ===
                            'published'
                              ? 'pill'
                              : 'pill unpublished'
                          }
                        >
                          {trip.status ===
                          'published'
                            ? 'Published'
                            : 'Draft'}
                        </span>
                      </td>

                      <td>
                        <div className="adminActions">

                          <button
                            className="btn secondary"
                            onClick={() =>
                              startEditTrip(
                                trip
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn secondary"
                            onClick={() =>
                              toggleTripStatus(
                                trip
                              )
                            }
                          >
                            {trip.status ===
                            'published'
                              ? 'Unpublish'
                              : 'Publish'}
                          </button>

                          <button
                            className="btn dangerBtn"
                            onClick={() =>
                              deleteTrip(trip)
                            }
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>

          </>
        )}

      </div>
    </main>
  )
}
