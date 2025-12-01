
CREATE TABLE payment_providers (
	id bigserial NOT NULL,
	providers_name text NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT payment_providers_pkey PRIMARY KEY (id)
);




CREATE TABLE vendor_plans (
	id bigserial NOT NULL,
	vendor_name text NOT NULL,
	plan_name text NOT NULL,
	price numeric(10, 2) NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT vendor_plans_pkey PRIMARY KEY (id)
);
--
--
CREATE UNIQUE INDEX idx_vendor_plans_vendor_plan ON public.vendor_plans USING btree (vendor_name, plan_name);



CREATE TABLE payment_customer_profiles (
	id bigserial NOT NULL,
	user_email_id text NOT NULL,
	authorize_customer_profile_id text NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	payment_provider_id int8 NULL,
	CONSTRAINT payment_customer_profiles_pkey PRIMARY KEY (id),
	CONSTRAINT payment_customer_profiles_payment_provider_id_fkey FOREIGN KEY (payment_provider_id) REFERENCES public.payment_providers(id)
);

--
--
CREATE INDEX idx_payment_customer_profiles_authorize_id ON public.payment_customer_profiles USING btree (authorize_customer_profile_id);
CREATE INDEX idx_payment_customer_profiles_email ON public.payment_customer_profiles USING btree (user_email_id);




CREATE TABLE payment_profiles (
	id bigserial NOT NULL,
	customer_profile_id int8 NOT NULL,
	authorize_payment_profile_id text NOT NULL,
	card_last4 text NULL,
	card_brand text NULL,
	first_name text NULL,
	last_name text NULL,
	streetnumber text NULL,
	city text NULL,
	state_province text NULL,
	zip_code int4 NULL,
	country text NULL,
	phonenumber text NULL,
	email text NULL,
	created_at timestamptz DEFAULT now() NULL,
	payment_provider_id int8 NULL,
	CONSTRAINT payment_profiles_pkey PRIMARY KEY (id),
	CONSTRAINT payment_profiles_customer_profile_id_fkey FOREIGN KEY (customer_profile_id) REFERENCES public.payment_customer_profiles(id) ON DELETE CASCADE,
	CONSTRAINT payment_profiles_payment_provider_id_fkey FOREIGN KEY (payment_provider_id) REFERENCES public.payment_providers(id)
);

--
--
CREATE INDEX idx_payment_profiles_authorize_payment_profile_id ON public.payment_profiles USING btree (authorize_payment_profile_id);
CREATE INDEX idx_payment_profiles_card_last4 ON public.payment_profiles USING btree (card_last4);
CREATE INDEX idx_payment_profiles_customer_profile_id ON public.payment_profiles USING btree (customer_profile_id);



CREATE TABLE payment_transactions (
	id bigserial NOT NULL,
	external_user_id text NOT NULL,
	customer_profile_id int8 NOT NULL,
	payment_profile_id int8 NOT NULL,
	amount numeric(10, 2) NOT NULL,
	authorize_transaction_id text NULL,
	status text NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	payment_provider_id int8 NULL,
	CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
	CONSTRAINT payment_transactions_payment_provider_id_fkey FOREIGN KEY (payment_provider_id) REFERENCES public.payment_providers(id)
);

--
--
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions USING btree (created_at);
CREATE INDEX idx_payment_transactions_customer_profile_id ON public.payment_transactions USING btree (customer_profile_id);
CREATE INDEX idx_payment_transactions_external_user_id ON public.payment_transactions USING btree (external_user_id);
CREATE INDEX idx_payment_transactions_payment_profile_id ON public.payment_transactions USING btree (payment_profile_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);